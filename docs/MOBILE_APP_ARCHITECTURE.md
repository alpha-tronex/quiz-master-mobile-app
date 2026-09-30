# Mobile App Architecture

**Stack:** React Native + Expo, TypeScript throughout. Targets iOS and Android from a single codebase, with EAS Build handling store submission.

## Scope (v1)

Student-facing only, regardless of who logs in:
- **Student:** register/login, browse quizzes available to their cohort, take a quiz (multiple choice, single answer, true/false), view results, view a quiz's summary and retake it if an admin has reopened it, view quiz history (grouped by quiz), edit account.
- **Admin:** none. Admin management (dashboard, quiz CRUD, user management) stays web-only in this release. If an admin account logs into the mobile app, they get the identical student experience above — no role branching, no admin nav, no "you're an admin" messaging. The mobile client never reads `user.type` for UI decisions in v1; it's a single-audience app. Server-side admin protection (`verifyAdmin`) is unaffected and stays in place regardless — the mobile client simply never calls any `/api/admin/*` endpoint.

This is a scope decision, not a security one: admin endpoints are already gated server-side, so there's no gap from omitting admin screens client-side. Revisit as a v2 if admin-on-mobile is ever requested.

No offline support in v1 — the app is online-only, consistent with how the current Angular app behaves. Graceful error/loading states cover network failures; there's no local cache or sync queue.

## Why React Native/Expo

Reuses the team's existing TypeScript fluency from the Angular codebase, ships one codebase for both platforms, and Expo's managed workflow removes most native build/config overhead for a CRUD-style app like this one (no need for custom native modules).

## Folder structure

Feature-based, mirroring the separation of concerns already present in the Angular app (`component` + `service` → `screen` + `hook` + `api`):

```
src/
  app/                    Navigation shell, root providers (QueryClient, auth context, theme)
    navigation/
      AuthStack.tsx         Login, Register
      MainTabs.tsx          Home, Quizzes, History, Account (bottom tabs)
      QuizzesStack.tsx       Nested native-stack behind the Quizzes tab: QuizList → TakeQuiz / QuizSummary
      RootNavigator.tsx      Switches AuthStack/MainTabs on auth state; hosts InactivityGate + OfflineBanner
    providers/
      AppProviders.tsx        Root provider tree: SafeAreaProvider > QueryClientProvider > NavigationContainer; wires AppState → focusManager
      queryFocusManager.ts     Maps RN AppState (active/background/inactive) onto TanStack Query's focusManager (no-op on web)
    screens/
      HomeScreen.tsx        Landing tab — quick-stat cards (completed/average/last quiz) summarizing quiz history, plus a cohort badge, sourced from useQuizHistory + useCohort
  features/
    auth/
      screens/              LoginScreen, RegisterScreen
      hooks/                useLogin, useRegister
      api/                  auth.api.ts  (POST /api/login, /api/register)
    quizzes/
      screens/              QuizListScreen, TakeQuizScreen, QuizSummaryScreen
      hooks/                useQuizzes, useQuiz, useSaveQuiz
      components/            AnswerOption (radio/checkbox row shared by TakeQuizScreen)
      api/                   quiz.api.ts  (GET /api/quizzes, /api/quiz, POST /api/quiz)
    history/
      screens/               HistoryScreen (accordion-grouped, one entry per quiz)
      hooks/                 useQuizHistory
      api/                   history.api.ts  (GET /api/quiz/history/:username)
    account/
      screens/               AccountScreen
      hooks/                 useUpdateAccount, useDeleteAccount, useStates, useCountries
      api/                   account.api.ts (PUT /api/user/update, DELETE /api/account), lookups.api.ts (GET /api/utils/{states,countries})
    cohort/
      hooks/                 useCohort
      api/                   cohort.api.ts  (GET /api/cohort/mine)
  shared/
    api/
      httpClient.ts          Fetch wrapper, Bearer-token injection, unified error handling
      apiError.ts             Typed ApiClientError matching the backend's `{ error: { code, message } }` shape
    types/
      quiz.ts                 Quiz, Question, QuestionType, QuizSummary — ported from src/app/shared/models/quiz.ts
      user.ts                 User, Address — ported from src/app/shared/models/users.ts
    utils/
      quizStats.ts             percentageOf, mostRecent, latestAttemptFor, groupHistoryByQuiz, formatCompletedAt, formatDuration — shared by HomeScreen, HistoryScreen, QuizSummaryScreen
    components/                Button, TextField, Select, Card, Badge, Banner, Accordion, LoadingState, ErrorState, EmptyState, OfflineBanner
    validation/                Shared validators (username, password, email, phone, zip) + validateForm
  core/
    auth/
      authStore.ts            Session state (Zustand), token persistence
      useInactivityTimeout.ts Schedules a silent logout after 15 min of no foreground touch activity
      InactivityGate.tsx       App-wide touch observer (PanResponder capture phase) that resets the timer; wraps RootNavigator
    network/
      useNetworkStatus.ts      Connectivity hook (NetInfo), backs the global OfflineBanner + Retry affordances
    config.ts                  API base URL, environment
    logger.ts                  Mirrors LoggerService from the Angular app
```

## Key architectural decisions

### Navigation — React Navigation
Auth stack (unauthenticated) → bottom tab navigator (authenticated). No role gate, no admin stack — every authenticated user, admin or student, lands in the same tab navigator. Structure maps onto the student-facing routes in `app-routing.module.ts`; `admin-routing.module.ts` has no mobile equivalent in v1.

### Server state — TanStack Query
Every API-backed read (quizzes, quiz detail, history, cohort, account lookups) goes through `useQuery`; every mutation (login, register, submit quiz, update account) goes through `useMutation`. This replaces the manual `Observable` + `catchError`/`retry` pattern in the Angular services (`questions-service.ts`, `login-service.ts`) with built-in caching, retry, and loading/error state — less boilerplate per screen, and each hook is independently unit-testable without rendering a component.

React Query's `refetchOnWindowFocus` does nothing on React Native by default — it's a browser concept. `AppProviders.tsx` subscribes React Query's `focusManager` to RN's `AppState` via `queryFocusManager.ts`, so a screen kept mounted by the bottom-tab navigator (e.g. `QuizListScreen`) refetches when the app is backgrounded and re-foregrounded, not just on remount — otherwise a quiz an admin just reopened wouldn't show as retake-able until the app was force-quit. `QuizListScreen` additionally wires a `RefreshControl` for manual pull-to-refresh. `useSaveQuiz` invalidates both `['quizHistory', username]` and `['quizzes']` on a successful submission, so History and the taken/locked flags on the quiz list update immediately without waiting for a focus event.

### Cohort-based quiz access
The backend scopes which quizzes a student can see to their assigned `Cohort` (`GET /api/cohort/mine`, enforced server-side — the client never decides which quizzes are accessible). The mobile app's role here is read-only: `useCohort` (in `features/cohort/`) fetches the current cohort name and `HomeScreen` renders it as a `Badge` ("Cohort: Fall 2026", or "Cohort: Guest" for an account with no cohort membership — including App/Play Store reviewers, who fall back to a seeded "Guest" cohort). `QuizListScreen`/`useQuizzes` don't filter anything client-side; `GET /api/quizzes` already returns only the accessible set.

### Quiz taken/locked state and retaking
`GET /api/quizzes` includes `taken`/`locked` flags per quiz (backend-computed — see `docs/BACKEND.md`'s quiz lock/reopen section). `QuizListScreen` renders a "Taken" or "Taken — reopened" `Badge` accordingly and routes a taken quiz to `QuizSummaryScreen` instead of `TakeQuizScreen`. `QuizSummaryScreen` shows the student's most recent attempt at that quiz (score, percentage, completion date, time taken — not a full per-question review, which stays admin-only on the web app) and offers a "Retake Quiz" button only when `locked` is `false` (an admin has granted a reopen); otherwise it shows a note that the quiz is locked.

### Scoring — client-side display only, not authoritative
`TakeQuizScreen` computes a score locally (`isQuestionCorrect`) purely to render the immediate results screen before the network round-trip completes. That client-computed score is included in the `POST /api/quiz` payload, but the backend does **not** trust it: `computeAuthoritativeScore` on the server recomputes `score`/`isCorrect` from the canonical quiz definition and saves that instead (see `docs/BACKEND.md`). A modified or replayed client payload can't post an arbitrary score.

### History — grouped by quiz, accordion UI
`HistoryScreen` groups the flat list `GET /api/quiz/history/:username` returns (one entry per attempt) by quiz id via `groupHistoryByQuiz` (`shared/utils/quizStats.ts`), since a quiz can have more than one attempt once it's been reopened and retaken. Each quiz renders as a collapsible `Accordion` row (`shared/components/Accordion.tsx`) — the header summarizes the latest attempt; expanding it lists every attempt for that quiz, most recent first. Groups are ordered by their most recent attempt, so a just-retaken quiz bubbles to the top.

### Client state — Zustand
A small `authStore` (`core/auth/authStore.ts`) holds the current `user`, `token`, and an `isHydrating` flag (plus `hydrate`/`setSession`/`clearSession` actions) — equivalent to `LoginService`'s `user`/`loggedIn` fields today, but reactive across the app without manual subscription plumbing. There's no separate `role` field in the store: per the "Scope (v1)" section above, the mobile client never branches UI on `user.type`, so role isn't tracked as first-class store state — it's only present, unused, as a property on the stored `user` object if the backend includes it.

### API client
One `httpClient` wrapping `fetch`, with:
- Automatic `Authorization: Bearer <token>` header injection (mirrors `auth.interceptor.ts`)
- Centralized error normalization (mirrors the `handleError` pattern duplicated in `questions-service.ts` and `login-service.ts` today — written once here instead of per-service)
- Typed request/response per endpoint, generated from the types in `shared/types/`

### Token storage
`expo-secure-store` (iOS Keychain / Android Keystore) in place of `localStorage`. Token is read once at app launch to restore session; cleared on logout.

### Session — inactivity logout
`useInactivityTimeout` schedules a silent `clearSession()` 15 minutes after the last foreground touch, no-ops when there's no active session, and reschedules on every touch. `InactivityGate` observes touches app-wide via `PanResponder`'s capture phase (`onStartShouldSetPanResponderCapture`, always returning `false`), so it never claims the responder or interferes with nested `Touchable`/`ScrollView` gestures — no `react-native-gesture-handler` dependency needed. It wraps the authenticated app tree in `RootNavigator`. Deliberately foreground-only (no `AppState`/background-duration tracking) and silent (no warning modal) by design — see the inline doc comments on both files for the reasoning.

### Account deletion
`AccountScreen` has a "Delete my account" button in a "Danger zone" section, gated behind a native `Alert.alert` confirm dialog (Cancel / destructive Delete) since it's irreversible. Confirming calls `useDeleteAccount` (`features/account/hooks/useDeleteAccount.ts`), which wraps `DELETE /api/account` and, on success, calls `clearSession()` — `RootNavigator`'s `{token ? <MainTabs /> : <AuthStack />}` branch then switches back to the auth stack automatically, no manual navigation needed. This exists to satisfy Apple App Store Guideline 5.1.1(v) (in-app account creation requires in-app account deletion); see `docs/BACKEND.md`'s (or `quizzes/Read Me/SECURITY.md`'s) "Account Deletion & Archival" section for the server-side cascade-delete and the separate, reversible admin archive/unarchive mechanism.

### Home screen
`HomeScreen` summarizes the same `GET /api/quiz/history/:username` data `HistoryScreen` lists in full, as three at-a-glance stat cards (quizzes completed, average score, last quiz) plus a `Badge` ("Personal best!") when the latest quiz ties or beats every prior score, derived via `shared/utils/quizStats.ts`. It also renders a cohort `Badge` ("Cohort: Guest", "Cohort: Fall 2026", ...) sourced from `useCohort`/`GET /api/cohort/mine` — see "Cohort-based quiz access" above. The cohort badge fails/loads silently (no separate spinner or error state); the history query already owns the screen's loading/error states.

### Types
`Quiz`, `Question`, `QuestionType`, `User`, `Address` are ported directly from `src/app/shared/models/` in the Angular app, keeping the data shape identical across both clients so the backend contract doesn't fork.

### Validation
Client-side validation rules (username, password, email, phone, zip) exist in three places: the Angular app (`validation.service.ts`), the backend (`validators.js`), and now this app's `shared/validation/` (`validators.ts` + `validateForm.ts`, both unit-tested), written to match the same rules as `validators.js` so all three stay in sync. This is a deliberate third copy, not a shared package — consolidating into one shared config/library consumed by all three clients is still a candidate for future cleanup, but hasn't been done.

### Branding
`assets/` holds the app icon (`icon.png`), Android adaptive icon layers (`android-icon-{foreground,background,monochrome}.png`), the web favicon (`favicon.png`), and the splash image (`splash-icon.png`, wired up via the `expo-splash-screen` config plugin in `app.json`). The Angular web app has no dedicated logo or icon asset to port (its favicon is the unmodified Angular CLI default), so these are a generated placeholder: a "QM" monogram in the brand colors from `shared/theme/theme.ts` (`colors.primary` `#1abc9c` teal fill, `colors.secondary` `#2c3e50` navy on the splash screen). Swap these files for real designed artwork whenever one is available — nothing else in the app references them by name.

## What's explicitly out of scope for v1
- Offline caching/sync (SQLite, WatermelonDB, etc.)
- Push notifications
- Native modules beyond what Expo's managed workflow provides
