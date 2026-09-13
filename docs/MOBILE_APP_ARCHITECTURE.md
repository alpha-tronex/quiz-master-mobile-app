# Mobile App Architecture

**Stack:** React Native + Expo, TypeScript throughout. Targets iOS and Android from a single codebase, with EAS Build handling store submission.

## Scope (v1)

Student-facing only, regardless of who logs in:
- **Student:** register/login, browse quizzes, take a quiz (multiple choice, single answer, true/false), view results, view quiz history, edit account.
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
      AuthStack.tsx        Login, Register
      MainTabs.tsx          Home, Quizzes, History, Account
  features/
    auth/
      screens/              LoginScreen, RegisterScreen
      hooks/                useLogin, useRegister
      api/                  auth.api.ts  (POST /api/login, /api/register)
    quizzes/
      screens/              QuizListScreen, TakeQuizScreen, ResultsScreen
      hooks/                useQuizzes, useQuiz, useSubmitQuiz
      api/                  quizzes.api.ts  (GET /api/quizzes, /api/quiz, POST /api/quiz)
    history/
      screens/               HistoryScreen
      hooks/                 useQuizHistory
      api/                   history.api.ts  (GET /api/quiz/history/:username)
    account/
      screens/               AccountScreen
      hooks/                 useUpdateAccount
      api/                   account.api.ts  (PUT /api/user/update)
  shared/
    api/
      httpClient.ts          Fetch/axios wrapper, Bearer-token injection, unified error handling
    types/
      quiz.ts                 Quiz, Question, QuestionType — ported from src/app/shared/models/quiz.ts
      user.ts                 User, Address — ported from src/app/shared/models/users.ts
    components/                Button, TextField, Card, Modal, etc.
    validation/                Shared validators (username, password, email, phone, zip)
  core/
    auth/
      authStore.ts            Session state (Zustand), token persistence
    network/
      useNetworkStatus.ts      Connectivity hook (NetInfo), backs the global OfflineBanner + Retry affordances
    config.ts                  API base URL, environment
    logger.ts                  Mirrors LoggerService from the Angular app
```

## Key architectural decisions

### Navigation — React Navigation
Auth stack (unauthenticated) → bottom tab navigator (authenticated). No role gate, no admin stack — every authenticated user, admin or student, lands in the same tab navigator. Structure maps onto the student-facing routes in `app-routing.module.ts`; `admin-routing.module.ts` has no mobile equivalent in v1.

### Server state — TanStack Query
Every API-backed read (quizzes, quiz detail, history, user list) goes through `useQuery`; every mutation (login, register, submit quiz, update account, admin CRUD) goes through `useMutation`. This replaces the manual `Observable` + `catchError`/`retry` pattern in the Angular services (`questions-service.ts`, `login-service.ts`) with built-in caching, retry, and loading/error state — less boilerplate per screen, and each hook is independently unit-testable without rendering a component.

### Client state — Zustand
A small `authStore` holds the current user, token, and role — equivalent to `LoginService`'s `user`/`loggedIn` fields today, but reactive across the app without manual subscription plumbing.

### API client
One `httpClient` wrapping `fetch`, with:
- Automatic `Authorization: Bearer <token>` header injection (mirrors `auth.interceptor.ts`)
- Centralized error normalization (mirrors the `handleError` pattern duplicated in `questions-service.ts` and `login-service.ts` today — written once here instead of per-service)
- Typed request/response per endpoint, generated from the types in `shared/types/`

### Token storage
`expo-secure-store` (iOS Keychain / Android Keystore) in place of `localStorage`. Token is read once at app launch to restore session; cleared on logout.

### Types
`Quiz`, `Question`, `QuestionType`, `User`, `Address` are ported directly from `src/app/shared/models/` in the Angular app, keeping the data shape identical across both clients so the backend contract doesn't fork.

### Validation
Client-side validation rules (username, password, email, phone, zip) currently exist in the Angular app (`validation.service.ts`) and are duplicated server-side (`validators.js`). The mobile app will need a third copy. Rather than hand-porting rules that can drift, `shared/validation/` should be written from the same rules as `validators.js` and flagged for future consolidation into one shared config/package consumed by all three.

### Branding
`assets/` holds the app icon (`icon.png`), Android adaptive icon layers (`android-icon-{foreground,background,monochrome}.png`), the web favicon (`favicon.png`), and the splash image (`splash-icon.png`, wired up via the `expo-splash-screen` config plugin in `app.json`). The Angular web app has no dedicated logo or icon asset to port (its favicon is the unmodified Angular CLI default), so these are a generated placeholder: a "QM" monogram in the brand colors from `shared/theme/theme.ts` (`colors.primary` `#1abc9c` teal fill, `colors.secondary` `#2c3e50` navy on the splash screen). Swap these files for real designed artwork whenever one is available — nothing else in the app references them by name.

## What's explicitly out of scope for v1
- Offline caching/sync (SQLite, WatermelonDB, etc.)
- Push notifications
- Native modules beyond what Expo's managed workflow provides
