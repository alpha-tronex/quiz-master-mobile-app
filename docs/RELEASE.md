# Release Runbook (Phase 6)

Manual, EAS-CLI-driven release process — same pattern as this developer's other
shipped Expo app (Language Translator, live on the App Store). No CI/CD, no
Fastlane, no automated release pipeline: a person runs each command and
watches the result before moving to the next step. Covers `PHASED_DELIVERY.md`
Phase 6: regression pass, TestFlight/Play internal testing, staged rollout.

## Backend

`EXPO_PUBLIC_API_URL` is set to `https://quizmaster.alphatronex.com` for the
`preview` and `production` build profiles in `eas.json` — confirmed live
(the Hetzner migration documented in `quizzes/DEPLOY.md` has gone out; the
domain serves the app and the `quizmaster-app`/`quizmaster-mongo` containers
are listed as live in `hetzner-infra/hetzner.md`). `JWT_SECRET` lives in
`server/.env.production` on the box (git-ignored) per Phase 0 — the server
serving traffic at all confirms it's set, since Phase 0 removed the
no-secret startup fallback.

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
   in `app.json`). Note the app's App Store Connect ID (a numeric string,
   e.g. `6785599159` for the reference app) — add it to `eas.json` as
   `submit.production.ios.ascAppId` once known.
2. **Google Play Console** developer account, and an app listing for package
   `com.alphatronex.quizmaster` (matches `android.package` in `app.json`).
   No `submit` block is used for Android here, same as the reference app —
   `.aab` uploads go through the Play Console UI by hand.
3. Store listing content lives in `store-assets/` (`store-copy.md`,
   `privacy-policy.md`) — fill in real screenshots/assets there before
   submitting either listing (content is drafted; screenshots still needed
   from a real build).
4. The privacy policy needs to be hosted at a public URL (both stores
   require this) before submission. A styled HTML version lives at
   `hetzner-infra/splash/quizmaster-privacy.html` (source of truth is
   `store-assets/privacy-policy.md` — keep them in sync). Deploy it with:
   ```bash
   rsync -a splash/ hetzner:/var/www/alphatronex/
   ```
   from the `hetzner-infra` repo — it'll be live at
   `https://alphatronex.com/quizmaster-privacy.html`. Use that URL in both
   App Store Connect's "Privacy Policy URL" field and the Play Console's
   Data Safety / App content section.

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
