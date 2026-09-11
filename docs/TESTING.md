# Testing Strategy

Both repos (`quizzes` backend, `Quiz Master Mobile App`) get test coverage before and during the build, not bolted on after. The backend currently has none (`server/package.json`'s `test` script is a stub) — closing that gap is part of Phase 0, since the mobile app becomes a second consumer of the same API contract.

## Backend (`quizzes/server`)

**Tooling:** Jest + Supertest, an in-memory MongoDB (`mongodb-memory-server`) for isolated test runs.

**Coverage targets:**
- `authRoutes.js` — register (success, validation errors, duplicate username/email), login (success, wrong password, unknown user), update user (auth required, validation).
- `quizRoutes.js` — list quizzes, get quiz by id, get default quiz, save completed quiz, get quiz history (auth required on all, 404s for missing user/quiz).
- `adminUserRoutes.js` — list/get/update users, all requiring admin role.
- `adminQuizRoutes.js` — quiz upload (question/answer validation, duplicate title detection, ID assignment), edit, delete — admin-only.
- `authMiddleware.js` — `verifyToken` (missing/invalid/expired token), `verifyAdmin` (non-admin rejected).

Run in CI on every PR; this suite is the regression safety net for both the web and mobile clients going forward.

## Mobile app (`Quiz Master Mobile App`)

**Unit tests — Jest + React Native Testing Library**
Because business logic lives in hooks (`useLogin`, `useQuizzes`, `useSubmitQuiz`, etc.) separate from screens, most logic is testable without rendering a full screen:
- Hooks: query/mutation behavior, loading/error states, cache invalidation after mutations (e.g. submitting a quiz should invalidate history).
- `httpClient`: token injection, error normalization, retry behavior.
- Validation functions: same cases as the backend's `validators.js` and the Angular app's `validation.service.spec.ts`, so all three implementations are checked against the same expectations.
- Components: rendering by state (loading, error, populated), user interaction (answer selection, form submission) via React Native Testing Library.

**Component rendering — RNTL 14's async API**
`@testing-library/react-native` 14.x rewrote `render`, `fireEvent`, and `userEvent` to be `async` (they now run on top of the [`test-renderer`](https://github.com/mdjastrzebski/test-renderer) package instead of the deprecated `react-test-renderer` sync API). Every component test must `await render(...)` before touching `screen` — calling it without `await` doesn't throw, it just leaves `screen` in its default "not rendered yet" state, so queries fail with a misleading `` `render` function has not been called `` error instead of a clear "you forgot to await" message. Interactions use `userEvent.setup()` + `await user.press(...)` / `await user.type(...)` (the library's now-recommended API) rather than the older synchronous `fireEvent`.

**API mocking — direct `fetch` mocks**
Originally planned around msw, but msw v2's package resolution (its internals are pure ESM, including a dependency with no CommonJS build) is incompatible with the React Native/Expo Jest preset's custom resolver as of Expo SDK 57 / RN 0.86 — it resolves to raw ESM/TS source that Jest can't parse, and the documented `customExportConditions` workaround doesn't apply because the RN preset substitutes its own resolver rather than Node's conditional-exports resolution. Hook and component tests instead mock `global.fetch` (or `httpClient` itself) directly per test with realistic request/response fixtures — same isolation from backend uptime, without fighting the framework. Revisit msw if a future Expo/Jest preset upgrade resolves the incompatibility.

**End-to-end — Detox or Maestro**
Critical user flows run against a real (or staging) backend on a simulator/emulator:
- Register → auto-login → land on Home
- Login → browse quizzes → take a quiz (all three question types) → submit → see results
- View quiz history after completing a quiz
- Edit account details and confirm persistence
- Token expiry: expired/invalid token redirects to login instead of crashing
- An admin account logging in gets the identical student experience — no admin nav or screens appear (mobile has no admin UI in v1; admin endpoints stay covered by the backend's own route tests)

Maestro is the lighter-weight option (YAML flow files, faster to write and maintain) and is the default recommendation unless the team already has Detox experience.

**Status:** `.maestro/register-login-logout.yaml` covers the first flow (register → auto-login → Home → log out → log in → Home → log out), written against the Phase 2 screens' `testID`s. It has not been run in this sandbox — Maestro needs a real iOS Simulator or Android emulator with the app installed and a reachable backend, and this development environment has neither. Treat it as unverified against a live app until someone runs it on an actual device/simulator; the YAML itself documents its required env vars and the placeholder `appId`.

## CI

GitHub Actions (or equivalent) runs on every PR in both repos:
1. Lint
2. Typecheck (`tsc --noEmit`)
3. Unit tests
4. E2E smoke suite on a schedule or pre-release, not necessarily every PR (slower, more flaky by nature)

## Coverage philosophy

Match the existing Angular app's convention of one `.spec.ts` per component/service, applied to the mobile app's hooks and screens. The goal isn't a coverage percentage target — it's that every screen's logic (not just its rendering) is exercised by a test that doesn't require a simulator, so the fast feedback loop stays fast.
