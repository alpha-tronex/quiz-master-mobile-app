# Backend Plan

**Status: all six items below have shipped.** This doc originally laid out the
Phase 0 hardening work needed before mobile development started; it's kept
as historical context for *why* the backend looks the way it does, with each
section updated to say what actually landed. Since then, the backend has
also grown a `Cohort` model (cohort-scoped quiz access, enforced server-side
via `server/utils/cohortAccess.js`), quiz lock/reopen state
(`reopenedQuizIds` on `User`, `server/utils/quizStatus.js`), and
authoritative server-side scoring (`computeAuthoritativeScore` in
`quizRoutes.js` recomputes score/`isCorrect` from the canonical quiz on every
submission rather than trusting the client's payload) — none of which was
part of the original Phase 0 scope, but all of which now live in the same
Express 5 / Mongoose 8 API this doc describes.

The mobile app reuses the existing Express 5 / Mongoose 8 API in the `quizzes` repo rather than standing up a new backend. This keeps a single source of truth for auth, user data, and quiz content, and lets the web app and mobile app evolve against the same contract. The changes below were hardening and cleanup, not a rewrite — most of the original routes (`authRoutes`, `quizRoutes`, `adminUserRoutes`, `adminQuizRoutes`, `utilRoutes`) kept their shape; `cohortRoutes`/`adminCohortRoutes` were added afterward for the cohort feature.

## Why these changes were needed before mobile work started

The API was built for a single browser client. A second client (React Native) exposed a few assumptions that were fine for a web-only app but became real problems on mobile:

- **JWT secret fallback.** `authMiddleware.js` falls back to a hardcoded default (`'your-secret-key-change-this-in-production'`) if `JWT_SECRET` isn't set. That's a silent security hole today; it becomes a bigger one once a second client is issuing and trusting tokens against it.
- **Inconsistent error shapes.** Some routes return `{ error: string }`, others `{ errors: string[] }`. The Angular app tolerates this ad hoc in each component's error handler. A typed mobile API client needs one contract to build against.
- **Quiz storage on disk.** `adminQuizRoutes.js` reads/writes `server/quizzes/quiz_N.json` at runtime for quiz upload/edit/delete. `render.yaml` indicates deployment to Render, where the filesystem is ephemeral — uploaded or edited quizzes can be lost on redeploy or restart. This is a pre-existing risk, not something mobile introduces, but it's worth fixing before a second client depends on quiz data being durable.
- **24-hour token expiry.** Reasonable for a browser tab someone closes and reopens daily. Less reasonable for an app people leave installed and reopen days later — they'll hit unexpected logouts mid-session.
- **No CORS configuration.** The Angular app is served from the same origin as the API in production, so CORS was never needed. The Expo dev client (and some build configurations) will call the API from a different origin and need it enabled explicitly.
- **No backend test suite.** `server/package.json`'s `test` script is currently a stub (`echo "Error: no test specified" && exit 1`). Once mobile depends on this API's behavior, regressions in `authRoutes` or `quizRoutes` affect two clients instead of one — this is the point where a route breaking silently gets expensive.

## Changes (all shipped)

### 1. Secure the JWT secret — done
The hardcoded fallback is gone from `authMiddleware.js`. The server now throws at startup (`JWT_SECRET environment variable is not set...`) if `JWT_SECRET` isn't present, instead of silently signing tokens with a known default.

### 2. Unify error response shape — done
Every route now throws/`next()`s a shared `ApiError` (`server/utils/apiError.js`), handled centrally by `server/middleware/errorHandler.js`, which serializes it as:
```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid username or password" } }
```
so the mobile `httpClient`/`apiError.ts` has one shape to parse everywhere.

### 3. Migrate quiz storage from flat files to MongoDB — done
`server/models/Quiz.js` is now the source of truth for quiz content; `quizRoutes.js` and `adminQuizRoutes.js` read/write Mongo instead of `server/quizzes/quiz_*.json`. This removed the ephemeral-disk risk on Render/Hetzner and made quiz content queryable.

### 4. Token lifetime strategy — done (extended expiry, no refresh tokens)
`JWT_EXPIRES_IN` (`server/middleware/authMiddleware.js`) defaults to `30d`. The simpler extended-expiry approach was chosen over a refresh-token flow, as anticipated below — quiz scores are low-sensitivity data and a 30-day token avoids the added complexity of a `/api/refresh` endpoint for v1.

### 5. Enable CORS — done
`cors` middleware is registered in `server/app.js`, scoped to the mobile app's and web app's expected origins.

### 6. Add a backend test suite — done
Jest + Supertest (with `mongodb-memory-server`) coverage now lives in `server/tests/`: `authRoutes.test.js`, `quizRoutes.test.js`, `adminUserRoutes.test.js`, `adminQuizRoutes.test.js`, `adminCohortRoutes.test.js`, `cohortRoutes.test.js`, `authMiddleware.test.js`, `quizHistory.test.js`, `quizScoring.test.js`, `quizRegrade.test.js`. Run via `npm test` (`jest --runInBand`) in `server/package.json`. This suite is the regression safety net both the Angular web app and this mobile app rely on.

## What stays the same

- Express 5 + Mongoose 8, no framework change.
- JWT bearer-token auth model (`Authorization: Bearer <token>`).
- Existing `User` schema, including embedded `quizzes` history array.
- Existing route structure and the `authRoutes(app, User)` dependency-injection pattern.
- `bcrypt` password hashing.

## What's been added since (not part of the original Phase 0 scope)

- **Cohort-based quiz access.** `server/models/Cohort.js`, `cohortRoutes.js` (student-facing `GET /api/cohort/mine`), `adminCohortRoutes.js` (admin CRUD), and `server/utils/cohortAccess.js` (`getAccessibleQuizIds`, which filters `GET /api/quizzes`/`GET /api/quiz` to a student's assigned cohort, falling back to a "Guest" cohort — 3 seeded quizzes — for accounts with no cohort membership, including App/Play Store reviewers).
- **Quiz lock/reopen.** `reopenedQuizIds` on `User`, `server/utils/quizStatus.js`. A quiz can only be taken once by default (`taken`/`locked` flags on `GET /api/quizzes`); an admin can grant a one-time reopen via an admin endpoint, consumed on the next `POST /api/quiz` for that quiz id, and can revoke an unused grant.
- **Server-side authoritative scoring.** `POST /api/quiz` no longer trusts the client-submitted `score`/`isCorrect` values. `computeAuthoritativeScore` in `quizRoutes.js` recomputes both from the canonical quiz definition before saving, closing a gap where a modified/replayed client payload could otherwise post an arbitrary score. A one-time regrade/backfill script exists for historical attempts saved before this change.
- **Account deletion & archival** (Apple App Store Guideline 5.1.1(v) compliance). `DELETE /api/account` — self-service, irreversible hard-delete of the caller's own account (any authenticated user), used by the mobile app's "Delete my account" button (see `docs/MOBILE_APP_ARCHITECTURE.md`'s "Account deletion" section). Both this and the existing admin hard-delete (`DELETE /api/admin/user/:id`) route through a shared `deleteUserCascade(userId, User, Cohort)` helper (`server/utils/userDeletion.js`) that also pulls the deleted user's id out of every `Cohort.students` array. Separately, `POST`/`DELETE /api/admin/user/:id/archive` is a reversible, idempotent admin toggle (`User.archived`/`archivedAt`) that blocks login (`403 ACCOUNT_ARCHIVED`) without deleting data — a housekeeping option, not the app's only deletion path.

## Out of scope for v1

- Push notifications.
- Offline sync endpoints (v1 is online-only per product decision).
- Replacing Express/Mongoose with a different backend framework.
