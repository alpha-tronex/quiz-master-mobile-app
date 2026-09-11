# Backend Plan

The mobile app reuses the existing Express 5 / Mongoose 8 API in the `quizzes` repo rather than standing up a new backend. This keeps a single source of truth for auth, user data, and quiz content, and lets the web app and mobile app evolve against the same contract. The changes below are hardening and cleanup, not a rewrite — most of the current routes (`authRoutes`, `quizRoutes`, `adminUserRoutes`, `adminQuizRoutes`, `utilRoutes`) stay as they are.

## Why these changes are needed before mobile work starts

The API was built for a single browser client. A second client (React Native) exposes a few assumptions that were fine for a web-only app but become real problems on mobile:

- **JWT secret fallback.** `authMiddleware.js` falls back to a hardcoded default (`'your-secret-key-change-this-in-production'`) if `JWT_SECRET` isn't set. That's a silent security hole today; it becomes a bigger one once a second client is issuing and trusting tokens against it.
- **Inconsistent error shapes.** Some routes return `{ error: string }`, others `{ errors: string[] }`. The Angular app tolerates this ad hoc in each component's error handler. A typed mobile API client needs one contract to build against.
- **Quiz storage on disk.** `adminQuizRoutes.js` reads/writes `server/quizzes/quiz_N.json` at runtime for quiz upload/edit/delete. `render.yaml` indicates deployment to Render, where the filesystem is ephemeral — uploaded or edited quizzes can be lost on redeploy or restart. This is a pre-existing risk, not something mobile introduces, but it's worth fixing before a second client depends on quiz data being durable.
- **24-hour token expiry.** Reasonable for a browser tab someone closes and reopens daily. Less reasonable for an app people leave installed and reopen days later — they'll hit unexpected logouts mid-session.
- **No CORS configuration.** The Angular app is served from the same origin as the API in production, so CORS was never needed. The Expo dev client (and some build configurations) will call the API from a different origin and need it enabled explicitly.
- **No backend test suite.** `server/package.json`'s `test` script is currently a stub (`echo "Error: no test specified" && exit 1`). Once mobile depends on this API's behavior, regressions in `authRoutes` or `quizRoutes` affect two clients instead of one — this is the point where a route breaking silently gets expensive.

## Planned changes

### 1. Secure the JWT secret
Remove the hardcoded fallback in `authMiddleware.js`. Fail fast at startup if `JWT_SECRET` is not set, instead of silently signing tokens with a known default.

### 2. Unify error response shape
Standardize every route on one error contract, e.g.:
```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid username or password" } }
```
or at minimum consistently use `{ errors: string[] }` everywhere so a shared mobile error handler can be written once.

### 3. Migrate quiz storage from flat files to MongoDB
Add a `Quiz` collection (or embed quizzes in a `Quiz` model separate from `User`) and migrate `server/quizzes/quiz_*.json` into it via a one-time script. Update `quizRoutes.js` and `adminQuizRoutes.js` to read/write Mongo instead of the filesystem. This removes the ephemeral-disk risk and also makes quiz content easier to query (e.g. list quizzes by title without reading every file).

### 4. Token lifetime strategy
Either:
- extend the JWT expiry (e.g. 7–30 days) with client-side handling for `401`s that redirects to login, or
- add a refresh-token flow: short-lived access token + longer-lived refresh token stored in `expo-secure-store`, with a `/api/refresh` endpoint.

Given the app's low sensitivity (quiz scores, not financial/health data), the simpler extended-expiry approach is likely sufficient for v1; refresh tokens can follow if needed.

### 5. Enable CORS
Add `cors` middleware scoped to the mobile app's expected origins/dev server, without opening the API to arbitrary origins in production.

### 6. Add a backend test suite
Jest + Supertest coverage for:
- `POST /api/register`, `POST /api/login` (success, validation failures, duplicate username/email, wrong password)
- `PUT /api/user/update` (auth required, validation)
- `GET /api/quizzes`, `GET /api/quiz`, `POST /api/quiz`, `GET /api/quiz/history/:username` (auth required, not-found cases)
- `GET/PUT /api/admin/users`, `/api/admin/user/:id` (admin-only enforcement)
- `POST /api/quiz/upload`, quiz edit/delete (admin-only, validation of question structure)
- `verifyToken` / `verifyAdmin` middleware (expired token, missing token, wrong role)

This suite becomes the regression safety net both clients rely on.

## What stays the same

- Express 5 + Mongoose 8, no framework change.
- JWT bearer-token auth model (`Authorization: Bearer <token>`).
- Existing `User` schema, including embedded `quizzes` history array.
- Existing route structure and the `authRoutes(app, User)` dependency-injection pattern.
- `bcrypt` password hashing.

## Out of scope for v1

- Push notifications.
- Offline sync endpoints (v1 is online-only per product decision).
- Replacing Express/Mongoose with a different backend framework.
