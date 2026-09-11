# Phased Delivery Plan

Incremental delivery, each phase producing something runnable/testable rather than one large build-then-integrate effort. See `BACKEND.md`, `MOBILE_APP_ARCHITECTURE.md`, and `TESTING.md` for the detail behind each phase.

## Phase 0 — Backend hardening
- Remove the hardcoded JWT secret fallback; require `JWT_SECRET` at startup.
- Unify error response shapes across all routes.
- Migrate quiz storage from flat JSON files to a MongoDB collection.
- Decide and implement token lifetime strategy (extended expiry vs. refresh tokens).
- Enable CORS for the mobile client.
- Add Jest + Supertest coverage for all existing routes and middleware.

*Exit criteria: backend test suite passes in CI; quiz data survives a redeploy; mobile can authenticate against the API from a different origin.*

## Phase 1 — Mobile scaffold
- Initialize Expo + TypeScript project in `Quiz Master Mobile App`.
- Set up navigation shell (auth stack, main tabs — no admin stack; see scope note below).
- Build `httpClient` with token injection and unified error handling.
- Set up `authStore` (Zustand) and `expo-secure-store` token persistence.
- Port `Quiz`, `Question`, `User`, `Address` types from the Angular models.
- Establish design system basics (theme, shared `Button`/`TextField`/`Card` components).
- Wire up Jest and React Native Testing Library (see TESTING.md for why msw was dropped in favor of direct `fetch` mocks).

*Exit criteria: app boots to a login screen; navigation shell renders; CI runs lint/typecheck/unit tests.*

## Phase 2 — Auth flow
- Login screen → `POST /api/login`.
- Register screen → `POST /api/register`.
- Token persisted securely; auto-login on app relaunch if a valid token exists.
- Logout clears session.
- Unit tests for `useLogin`/`useRegister` hooks; Maestro/Detox flow for register → login → logout.

*Exit criteria: a new user can register, land on Home, close and reopen the app and stay logged in, and log out.*

## Phase 3 — Student core (quiz taking)
- Quiz list screen → `GET /api/quizzes`.
- Take-quiz screen supporting all three question types (multiple choice, single answer, true/false) → `GET /api/quiz`.
- Submit flow → `POST /api/quiz`.
- Results screen showing score.
- History screen → `GET /api/quiz/history/:username`.

*Exit criteria: a student can complete the full quiz-taking loop end to end, matching `questions.component.ts` and `history.component.ts` parity.*

## Phase 4 — Account management
- Account screen (view/edit profile) → `PUT /api/user/update`.

*Exit criteria: profile edits persist and reflect immediately in the app.*

## Phase 5 — Polish
- Consistent loading/error/empty states across all screens.
- App icons, splash screen, branding.
- Accessibility pass (labels, contrast, touch targets).
- Graceful handling of network failures (no offline sync, but no crashes either).

*Exit criteria: app feels finished, not just functional.*

## Phase 6 — QA & release
- Full regression pass against the E2E suite.
- TestFlight (iOS) and Play internal testing (Android) via EAS Build.
- Staged rollout.

*Exit criteria: app is live/available to real users on both platforms.*

## Sequencing notes
- Phase 0 blocks everything else that touches quiz storage or auth — do it first, not in parallel.
- Phases 1–2 can start once Phase 0's auth changes (token lifetime, CORS) are in place, even before the quiz-storage migration finishes.
- Admin (dashboard, quiz management, user management) is out of scope for this release — see `MOBILE_APP_ARCHITECTURE.md`. The mobile app is student-only regardless of the logged-in account's role; there is no admin phase to sequence here. Web admin is unaffected and unchanged.
