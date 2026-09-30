# Release Runbook (Phase 6)

Manual, EAS-CLI-driven release process — same pattern as this developer's other
shipped Expo app (Language Translator, live on the App Store). No CI/CD, no
Fastlane, no automated release pipeline: a person runs each command and
watches the result before moving to the next step. Covers `PHASED_DELIVERY.md`
Phase 6: regression pass, TestFlight/Play internal testing, staged rollout.

## Current status (as of 2026-09-29)

- **iOS:** Apple rejected the prior submission under **Guideline 5.1.1(v)**
  — an app with in-app account creation must also support in-app account
  deletion, not just deactivation or a customer-service request. Fixed:
  every user now has a "Delete my account" button on the Account screen
  (irreversible self-service hard-delete via `DELETE /api/account` — see
  `docs/MOBILE_APP_ARCHITECTURE.md`'s "Account deletion" section and
  `docs/BACKEND.md`'s "Account deletion & archival" entry). A **new** build
  incorporating this fix needs to go through `eas build` → TestFlight →
  resubmission (see "Every release" below); the previous rejected build is
  not resubmittable as-is. `eas.json`'s `submit.production.ios.ascAppId` is
  set to `6812153773` (this app's real App Store Connect ID, not a
  placeholder).
- **Store category:** Primary = **Education**, Secondary = **Utilities**, set
  in the App Store Connect listing (not in `app.json`/`eas.json` — Apple's
  category fields live only in App Store Connect).
- **Android:** no Play Console submission has happened yet. The Android
  build/submit steps below are still the plan, not something that's shipped.
- **Privacy policy:** hosted directly by the backend — see "Privacy policy
  URL" below; this superseded an earlier plan to host it as a static page via
  `hetzner-infra`.

## Backend

`EXPO_PUBLIC_API_URL` is set to `https://quizmaster.alphatronex.com` for the
`preview` and `production` build profiles in `eas.json` — confirmed live
(the Hetzner migration documented in `quizzes/DEPLOY.md` has gone out; the
domain serves the app and the `quizmaster-app`/`quizmaster-mongo` containers
are listed as live in `hetzner-infra/hetzner.md`). `JWT_SECRET` lives in
`server/.env.production` on the box (git-ignored) — see `docs/BACKEND.md`
item 1: the server serving traffic at all confirms it's set, since the
hardcoded fallback was removed and the server now refuses to start without it.

The `development` profile intentionally has no `env` override: dev-client
builds still run their JS through Metro, so `EXPO_PUBLIC_API_URL` there
comes from your local `.env.local` (see `src/core/config.ts`), not from
`eas.json`.

## One-time setup (dev-account / internal testing)

These happen once, outside this repo, before the first build lands on a
physical device. None of them can be run from this sandbox — they need an
interactive `eas login` with your Apple ID and Expo account.

```bash
eas login                 # your Expo account
eas init                  # links this project, populates extra.eas.projectId in app.json
eas device:create         # registers a tester's iOS device UDID for ad-hoc signing
                           # (prints/emails a registration link — open it on the device itself)
eas build --profile preview --platform ios
```

The first `eas build` for iOS will prompt to log into your Apple Developer
account and either reuse or generate a distribution certificate + ad-hoc
provisioning profile scoped to the UDIDs registered above — EAS manages all
of this, no manual Xcode signing needed. The resulting build installs
directly (via a QR code / link EAS prints) without going through TestFlight.

## One-time setup (store submission)

Only needed once you're moving past internal/dev-account testing toward a
public release:

1. **Apple Developer Program** account, and an App Store Connect app record
   for bundle ID `com.alphatronex.quizmaster` (matches `ios.bundleIdentifier`
   in `app.json`). **Done** — the app's App Store Connect ID is `6812153773`,
   already set in `eas.json` as `submit.production.ios.ascAppId`. Listing
   name is "Quiz Master by Alphatronex" (plain "Quiz Master" was taken);
   `app.json`'s internal `expo.name` stays "Quiz Master". Category: Primary
   Education, Secondary Utilities.
2. **Google Play Console** developer account, and an app listing for package
   `com.alphatronex.quizmaster` (matches `android.package` in `app.json`).
   **Not started yet.** No `submit` block is used for Android here, same as
   the reference app — `.aab` uploads go through the Play Console UI by hand.
3. Store listing content lives in `store-assets/` (`store-copy.md`) — the
   iOS submission's screenshots and required fields have since been filled
   in via App Store Connect directly; `store-assets/` still needs a pass to
   reflect that before it's used again for the Android listing.
4. **Privacy policy.** The backend now serves this itself: `server/app.js`
   registers `GET /privacy`, which serves `server/public/privacy.html` as a
   static page (registered before the Angular catch-all route so it isn't
   swallowed by it) — live at `https://quizmaster.alphatronex.com/privacy`.
   Use that URL in both App Store Connect's "Privacy Policy URL" field and
   the Play Console's Data Safety / App content section. (An earlier plan to
   host a separate static page via `hetzner-infra/splash/` and rsync was
   superseded by this — the backend-served route is simpler to keep in sync
   since it deploys with the rest of the API.)

## Every release

### 1. Regression pass

- `npm run typecheck`
- `npm run lint`
- `npm test` (full suite)
- Run `.maestro/register-login-logout.yaml` on a real iOS Simulator or
  Android emulator against a reachable backend — this has never been run
  outside a real device/emulator (see `docs/TESTING.md`); do this before
  every release, not just once.

### 2. Build

```
eas build --profile production --platform ios
eas build --profile production --platform android
```

Use `--profile preview` first for an internal-distribution build to sanity
check on a physical device before cutting a production build. `preview` and
`development` builds install directly (internal distribution); `production`
builds are what get submitted to the stores.

### 3. Submit

**iOS → TestFlight:**
```
eas submit -p ios --latest
```
Requires `submit.production.ios.ascAppId` in `eas.json` (see setup step 1).
Add internal testers in App Store Connect once the build finishes processing.

**Android → Play internal testing:**
Download the `.aab` from the `eas build` output and upload it manually
through the Play Console's Internal testing track — no `eas submit` config
for Android, matching the reference app.

### 3a. Submit to App Store review

Once a TestFlight build has been sanity-checked, promote it to a full App
Store Connect submission from the App Store Connect UI (version metadata,
screenshots, "What's New" notes, App Review Information). No `eas` command
for this step — it's done in App Store Connect directly, same as the
category (Primary: Education, Secondary: Utilities) and Privacy Policy URL
fields (see setup step 4 above).

**Demo/test account for App Review.** No demo or reviewer login credentials
are committed anywhere in this repo or the `quizzes` repo (searched for
`appletest`, `demo account`, `test account` — the only hits are an unrelated
stress-test cleanup script and a DEPLOY.md note about registering a fresh
test account manually to verify cohort assignment, not App Review
credentials). If App Review needs a working login, either register a real
account on `https://quizmaster.alphatronex.com` and enter those credentials
in App Store Connect's "App Review Information → Sign-in required" fields,
or note in that field that no login is required to evaluate the app's core
flow (registration is self-service). Whatever was actually entered lives
only in App Store Connect, not in this repo.

### 4. Staged rollout

- **iOS:** enable phased release in App Store Connect when promoting from
  TestFlight to the App Store listing (Apple ramps automatically over 7 days).
- **Android:** set a rollout percentage on the Play Console production track
  and increase it manually as confidence builds.

## What's deliberately not here

No GitHub Actions, no Fastlane, no automated E2E-in-CI — `docs/TESTING.md`
describes the CI plan as aspirational, and the reference app (Language
Translator) ships without any of it. Revisit if release cadence increases
enough that manual steps become the bottleneck.
