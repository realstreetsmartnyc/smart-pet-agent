# Smart Pet Agent — Publish Runbook (v1.0.0)

This runbook tells the next person (or agent) exactly what to do the moment
each external blocker is unblocked. It is intentionally short: the verified
state and gate history live in `docs/PUBLISH_REMEDIATION_PLAN_2026-09-01.md`
and `docs/RELEASE_CHECKLIST.md`; this runbook is only the action bridge.

## Verified anchors (do not re-derive)

- Linux desktop: `apps/electron/build/Smart Pet Agent-0.1.0.AppImage` (108 MB)
  + `apps/electron/build/smart-pet-agent_0.1.0_amd64.deb` (157 MB).
  `scripts/e2e-electron.sh` is GREEN; both `/usr/bin/smart-pet-agent` and
  the AppImage boot to `agent.ready`.
- Android debug APK: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
  (173,108,665 bytes). `scripts/verify-android-apk.sh` PASS. Package
  `ai.smartpet.agent`, versionCode 1, targetSdk 34, launchable
  `ai.smartpet.agent.MainActivity`.
- Play Console Data Safety form (paste-in): `docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md`.
- Release checklist: `docs/RELEASE_CHECKLIST.md` (current gate truth).

## Required secrets (set in GitHub repo settings → Secrets and variables → Actions)

| Secret | Used by | Notes |
|---|---|---|
| `EAS_TOKEN` | mobile-preview, mobile-android-play-internal | `npx eas token` output, scoped to the `ai.smartpet.agent` Expo project |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | mobile-android-play-internal | Full JSON content of the Play Console service-account key (write to `apps/mobile/service-account-key.json` at submit time — the workflow does this already) |
| `ASC_API_KEY` (or `ASC_API_KEY_PATH` + `APPLE_TEAM_ID`) | future iOS job | App Store Connect API key (.p8) + key ID + issuer ID; team ID for the Apple Developer account that owns `ai.smartpet.agent` |
| `WIN_CSC_LINK` + `WIN_CSC_KEY_PASSWORD` (optional) | desktop-publish-windows | For signed Windows installer; omit for unsigned (acceptable for private alpha) |
| `CSC_LINK` + `CSC_KEY_PASSWORD` (optional) | desktop-publish-macos | For signed/notarized macOS DMG; omit for unsigned (acceptable for private alpha) |

## Unblock sequence (ordered)

### 1. Push to `main` — unblocks G2 (Windows) and G4 (macOS) CI artifact gates

The `.github/workflows/ci.yml` has three desktop jobs (`desktop-publish-ubuntu`,
`desktop-publish-windows`, `desktop-publish-macos`) and one mobile preview
job (`mobile-preview`) that all trigger on `push` to `main`. Linux (`ci` +
`desktop-publish-ubuntu`) is already proven locally, so the next push
primarily produces the Windows NSIS and macOS DMG artifacts.

After the push:
- Download the `nsis-windows` and `dmg-macos` artifacts from the Actions run.
- Run the local verify scripts against them:
  - Windows (on a Windows host): `./scripts/verify-windows-nsis.ps1`
  - macOS (on a macOS host): `bash scripts/verify-macos-dmg.sh`
- Update `docs/RELEASE_CHECKLIST.md` lines:
  - `Windows NSIS: [BLOCKED]` → `[VERIFIED]` once the artifact is exercised
  - `macOS DMG: [BLOCKED]` → `[VERIFIED]` once the artifact is mounted + launched

### 2. Register the Expo project — unblocks G3.5 (EAS preview APK)

```bash
cd apps/mobile
npx expo login                      # uses the Expo account that owns the project
npx eas init                        # links the project; prints the real projectId
# Edit app.json → expo.extra.eas.projectId → replace the placeholder with the printed UUID
# Commit the UUID change.
```

Then `scripts/verify-eas-identity.sh` should PASS. Push to `main` →
`mobile-preview` CI job builds the Android APK via EAS. Download the
`android-debug-apk` artifact, compare its `aapt2 dump badging` output to
the locally-built one (package + versionCode + permissions must match).

### 3. Promote to Play Internal — unblocks G3.6 (production AAB)

```bash
# In GitHub: Settings → Secrets → add GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
# (the full JSON of the service account Play Console created for the app)
```

Then trigger `mobile-android-play-internal` via **Actions → Run workflow**
(it's `workflow_dispatch`-only). It will:
1. Verify the EAS identity.
2. Write the service-account JSON to `apps/mobile/service-account-key.json`.
3. `eas build --platform android --profile production` (produces an AAB).
4. `eas submit --platform android --profile production` (uploads to the
   `internal` track).

After the run, in Play Console → Internal testing, the new release should
appear with versionCode 1. Add testers, run the device permission audit
(G3.4 — needs a physical device), and when ready, promote to closed/open
testing and then production.

### 4. Device permission audit (G3.4)

Connect a physical Android device (or boot an emulator) with USB debugging
enabled, then:

```bash
adb devices                         # device should appear as "device"
adb install apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
bash scripts/verify-android-device.sh   # exercises camera/mic/notifications/biometric
```

Record the results in `docs/RELEASE_CHECKLIST.md` (Android line).

### 5. iOS (G5) — blocked on Apple Developer enrollment

```bash
# After enrolling in the Apple Developer Program ($99) and creating the
# App Store Connect entry for ai.smartpet.agent:
cd apps/mobile
npx eas init                        # if not already done in step 2
# Add ASC_API_KEY (p8 + keyID + issuerID) and APPLE_TEAM_ID to GitHub secrets
# Edit eas.json → submit.production.ios:
#   - appleId:  your real Apple ID
#   - appleTeamId:  YOUR_TEAM_ID (no longer a placeholder)
npx eas build --platform ios --profile production
# When ready: npx eas submit --platform ios --profile production
```

For the TestFlight internal pass (G5.1):
```bash
npx eas build --platform ios --profile preview   # internal distribution
```
Then in App Store Connect → TestFlight → add internal testers.

## Hold points (do not skip)

- **Do not commit or tag (G6.2/G6.3) until every gate is `[VERIFIED]` in
  `docs/RELEASE_CHECKLIST.md`.** The goal's hard rule: "No tag/publish until
  every gate passes."
- **Do not skip the openjdk-17-jdk install line in the `mobile-preview` CI
  job.** Without it, the Android build fails with `jlink does not exist`.
- **Do not remove `pnpm.onlyBuiltDependencies` from the root `package.json`.**
  It's required for the `better-sqlite3` / `electron` / `esbuild` postinstalls
  to run under pnpm's frozen-lockfile install.
- **No personal/developer credentials or third-party project connections are
  baked into the app (Turn 11).** The app does not ship a `google-services.json`,
  a `GoogleService-Info.plist`, a Firebase `projectId`, a developer's API key,
  or a hardcoded provider `baseURL`. v1.0.0 uses local notifications only —
  no remote push, no analytics, no Crashlytics. If a future feature requires a
  third-party service (e.g., remote push, hosted telemetry), the user MUST
  supply their own credentials at runtime via Settings UI or env var; do NOT
  re-bake developer credentials into the shipped artifact. The Data Safety form
  must be updated whenever a third-party integration is added or removed.

## Pointers

- Full audit: `docs/PUBLISH_READINESS_AUDIT_2026-09-01_FULL.md`
- Full remediation log (turn-by-turn): `docs/PUBLISH_REMEDIATION_PLAN_2026-09-01.md`
- Current gate truth: `docs/RELEASE_CHECKLIST.md`
- Data Safety form: `docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md`
- Concurrent-edit cordon: see the `spa-concurrent-edit-cordon` prompt addendum
  (do not stage or edit `pnpm-lock.yaml`, `apps/electron/dist/*`, or the
  underling-managed `docs/*` files unless explicitly asked).
