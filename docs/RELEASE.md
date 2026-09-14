# Release Runbook (Phase 6)

Manual, EAS-CLI-driven release process — same pattern as this developer's other
shipped Expo app (Language Translator, live on the App Store). No CI/CD, no
Fastlane, no automated release pipeline: a person runs each command and
watches the result before moving to the next step. Covers `PHASED_DELIVERY.md`
Phase 6: regression pass, TestFlight/Play internal testing, staged rollout.

## One-time setup

These happen once, outside this repo, before the first real release. None of
them can be done from this sandbox (no network/store credentials).

1. **Apple Developer Program** account, and an App Store Connect app record
   for bundle ID `com.alphatronex.quizmaster` (matches `ios.bundleIdentifier`
   in `app.json`). Note the app's App Store Connect ID (a numeric string,
   e.g. `6785599159` for the reference app) — add it to `eas.json` as
   `submit.production.ios.ascAppId` once known.
2. **Google Play Console** developer account, and an app listing for package
   `com.alphatronex.quizmaster` (matches `android.package` in `app.json`).
   No `submit` block is used for Android here, same as the reference app —
   `.aab` uploads go through the Play Console UI by hand.
3. **`eas init`** (run from the project root) to create/link an EAS project
   and populate `extra.eas.projectId` in `app.json`. Not set yet.
4. Store listing content lives in `store-assets/` (`store-copy.md`,
   `privacy-policy.md`) — fill in real screenshots/assets there before
   submitting either listing. The privacy policy needs to be hosted at a
   public URL (both stores require this) before submission.

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
