# Testing Strategy

Both repos (`quizzes` backend, `Quiz Master Mobile App`) get test coverage before and during the build, not bolted on after. The backend's Phase 0 stub test script has since been filled in — see below — since the mobile app is a second consumer of the same API contract.

## Backend (`quizzes/server`)

**Tooling:** Jest + Supertest, an in-memory MongoDB (`mongodb-memory-server`) for isolated test runs. Run via `npm test` (`jest --runInBand`).

**Actual coverage (`server/tests/`):**
- `authRoutes.test.js` — register (success, validation errors, duplicate username/email), login (success, wrong password, unknown user), update user (auth required, validation).
- `quizRoutes.test.js` — list quizzes, get quiz by id, get default quiz, save completed quiz, get quiz history (auth required on all, 404s for missing user/quiz).
- `quizScoring.test.js` — authoritative server-side scoring (`computeAuthoritativeScore`): client-submitted `score`/`isCorrect` is recomputed and cannot be trusted as-is.
- `quizRegrade.test.js` — the historical regrade/backfill script for attempts saved before authoritative scoring shipped.
- `quizHistory.test.js` — history endpoint's live quiz-title join (titles reflect the current quiz record, not a stale snapshot from submission time).
- `adminUserRoutes.test.js` — list/get/update users, all requiring admin role.
- `adminQuizRoutes.test.js` — quiz upload (question/answer validation, duplicate title detection, ID assignment), edit, delete — admin-only.
- `adminCohortRoutes.test.js` / `cohortRoutes.test.js` — cohort CRUD (admin-only) and the student-facing `GET /api/cohort/mine`, including the no-cohort → "Guest" fallback.
- `authMiddleware.test.js` — `verifyToken` (missing/invalid/expired token), `verifyAdmin` (non-admin rejected).

This suite is the regression safety net for both the web and mobile clients.

## Mobile app (`Quiz Master Mobile App`)

**Unit tests — Jest + React Native Testing Library**
Because business logic lives in hooks (`useLogin`, `useRegister`, `useQuizzes`, `useQuiz`, `useSaveQuiz`, `useQuizHistory`, `useCohort`, `useUpdateAccount`, etc.) separate from screens, most logic is testable without rendering a full screen. Every hook, API wrapper, and shared component listed below has a colocated `__tests__` file in this repo:
- Hooks: query/mutation behavior, loading/error states, cache invalidation after mutations — `useSaveQuiz` invalidates both the saving user's quiz history and the `['quizzes']` list (so a just-submitted quiz stops showing as retake-able).
- `httpClient`: token injection, error normalization, retry behavior — see `apiError.ts` for the shared `ApiClientError` shape matching the backend's `{ error: { code, message } }` contract.
- `queryFocusManager.ts`: RN `AppState` → TanStack Query `focusManager` mapping (active/background/inactive), unit-tested standalone without rendering a component.
- `shared/utils/quizStats.ts`: `percentageOf`, `mostRecent`, `latestAttemptFor`, `groupHistoryByQuiz`, `formatCompletedAt`, `formatDuration` — the derived-stats/grouping logic shared by HomeScreen, HistoryScreen, and QuizSummaryScreen.
- Validation functions: same cases as the backend's `validators.js` and the Angular app's `validation.service.spec.ts`, so all three implementations are checked against the same expectations.
- Components: rendering by state (loading, error, populated), user interaction (answer selection, form submission, accordion expand/collapse) via React Native Testing Library — including the shared `Accordion` component used by `HistoryScreen`.

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

**Status:** `.maestro/register-login-logout.yaml` covers the first flow (register → auto-login → Home → log out → log in → Home → log out), written against the Phase 2 screens' `testID`s, using `tabBarButtonTestID` to reach the Account tab and `scrollUntilVisible` to reach the logout button below the fold. It's the only flow written so far — the other flows in the list above (quiz-taking, history, account edit, token expiry, admin-as-student) remain unwritten. The YAML documents its own required env vars (`MAESTRO_TEST_UNAME`, `MAESTRO_TEST_EMAIL`, `MAESTRO_TEST_PASS`) and real `appId` (`com.alphatronex.quizmaster`, matching the shipped bundle identifier). It still cannot run inside this development sandbox — Maestro needs a real iOS Simulator or Android emulator with the app installed and a reachable backend — so treat it as unverified against a live app unless it's been run manually on an actual device/simulator.

## CI

`.github/workflows/ci.yml` runs on every pull request and every push to `main` (Ubuntu, Node 22, `npm ci` — which also applies `patches/` via `postinstall`). Each step runs even if an earlier one fails, so a PR shows every problem at once:
1. Lint — `npm run lint`
2. Typecheck — `npm run typecheck` (`tsc --noEmit`)
3. Unit tests — `npx jest --ci`, with Jest's transform cache persisted between runs via `actions/cache`. `package.json` sets `testTimeout: 20000`: on a cold cache the first render test in a suite can exceed Jest's 5s default, which made `HomeScreen`/`RegisterScreen`/`TakeQuizScreen` fail intermittently on fresh checkouts.
4. Testability audit — `npm run audit:testability` (`scripts/testability-audit.sh`), written to the job summary. **Hard** checks fail the build: `fetch()` outside `httpClient`, screens/components importing an `*.api` module directly, un-awaited RNTL calls (`render`/`renderHook`/`rerender`/`unmount`/`user.*`), a test `QueryClient` without `retry: false`, snapshot tests. **Advisory** checks only report known debt: source files with no colocated test (opt out with a `// @testability-exempt: <reason>` comment), clock/randomness read inside screens, screens over 300 lines.

The backend repo's CI is separate. The E2E (Maestro) smoke suite isn't in CI yet — it needs a simulator and a reachable backend, so it's meant to run on a schedule or pre-release rather than per PR.

## Coverage philosophy

Match the existing Angular app's convention of one `.spec.ts` per component/service, applied to the mobile app's hooks and screens. The goal isn't a coverage percentage target — it's that every screen's logic (not just its rendering) is exercised by a test that doesn't require a simulator, so the fast feedback loop stays fast.
