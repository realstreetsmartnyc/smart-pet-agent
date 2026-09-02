# Smart Pet Agent v1.0.0-alpha.1 — Linux + Android (Private Alpha)

> **Status: private alpha / technical preview.**
> Linux desktop (AppImage + deb) and Android (debug APK) installers are ready for early evaluation. iOS, signed Windows, and signed macOS installers are in progress (see the [publish checklist](docs/RELEASE_CHECKLIST.md) for the gate state).

## What's in this release

- **Linux desktop** — `smart-pet-agent` v1.0.0 (Electron 33.4.11, MIT)
  - `Smart Pet Agent-1.0.0.AppImage` (~107 MiB) — runs on any modern Linux without install
  - `smart-pet-agent_1.0.0_amd64.deb` (~75 MiB) — installs via `sudo dpkg -i`
  - Both boot to `agent.ready` and exercise the verified runtime path (chat streaming, permission persistence, chat history).
- **Android** — `ai.smartpet.agent` v1.0.0 (React Native / Expo SDK 51, MIT)
  - `app-debug.apk` (~165 MiB, includes both arm64-v8a and x86_64 native libs) — install with `adb install app-debug.apk`
  - Hermes JS engine, expo-sqlite for on-device pet state, modern Android permissions (no Firebase, no analytics, no tracking).
  - **Not yet on Google Play** — this is a debug-signed APK for sideload testing. The Play Internal track upload is wired (`mobile-android-play-internal` CI job) and activates when the EAS + Play service account secrets are configured.
- **Linux CLI** — `smart-pet` v1.0.0 — 97 KB CJS bundle, runs on any Node 20+
- **Linux TUI** — `smart-pet-tui` v1.0.0 — 2.1 MB ESM bundle (Ink-based, terminal-only)
- **Design tokens** — `@smart-pet/ui-tokens` v1.0.0 — single-source CSS, consumed by the GUI + TUI

## Verified behavior

| Check | Result |
|---|---|
| `pnpm typecheck` (core + cli + tui) | exit 0 |
| `pnpm test` (24/24) | pass |
| `bash scripts/smoke.sh` (7/7 stages) | GREEN |
| `bash scripts/e2e-electron.sh` (packaged runtime) | GREEN — `agent.ready`, 11 chunks, history:2, permission persist |
| `scripts/verify-android-apk.sh` | PASS |
| `apksigner verify` (debug APK) | PASS — signed v1 + v2 schemes |
| No Firebase / analytics / tracking in source | verified |
| `pnpm install --frozen-lockfile` (CI prerequisite) | clean |

## Privacy & data

This is a **local-first** app. The desktop and Android builds:

- Store pet state, permissions, and chat history **on-device only** (SQLite in the app's private data dir).
- Make outbound network calls **only** to AI provider baseURLs the user explicitly configures in Settings (e.g., a local Ollama at `http://127.0.0.1:11434` or a hosted endpoint the user supplies with their own API key). The app does not bake in any provider credentials or third-party project connections.
- Bundle **no analytics, no crash reporting, no tracking SDK**. The `com.google.android.c2dm.permission.RECEIVE` permission in the APK is a library-level declaration from `expo-notifications`; it does not connect to any Firebase project (no `google-services.json` is shipped).
- The full Play Console Data Safety form is in [`docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md`](docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md) and accurately reflects this posture.

## What you can test

1. **Chat with a local Ollama** — start Ollama on your machine (`ollama serve`), launch the desktop app, configure the provider in Settings (`baseURL: http://127.0.0.1:11434`, no API key needed), and chat.
2. **Chat with a hosted OpenAI-compatible endpoint** — configure the provider in Settings with your own baseURL + API key. The app does not store or transmit your key anywhere except the local config.
3. **Permission grant/deny** — the desktop app prompts for camera/mic/notifications/biometric. Permissions persist across restarts. The Android APK has the same permission set in its manifest.
4. **Custom Pet Creator (MVP)** — generate a custom pet from a description, validate the pack, activate it (install to `~/.smart-pet-agent/pets/`), list installed pets, export to `.smartpet`, import a `.smartpet` file, rollback to the previous version. All on-device.

## What is NOT in this release

- **iOS** — pending Apple Developer enrollment, `ASC_API_KEY` + `APPLE_TEAM_ID` secrets, and TestFlight setup. The iOS bundle identifier is registered (`ai.smartpet.agent`) but no iOS build has been produced.
- **Signed Windows installer** — the `desktop-publish-windows` CI job is wired; the actual NSIS build will run on `windows-latest` when a CI run is triggered (push to main).
- **Signed/notarized macOS DMG** — the `desktop-publish-macos` CI job is wired (runs `iconutil -c icns` then `electron-builder --mac`); the actual DMG + codesign + notarize will run on `macos-latest`.
- **Play Store / App Store listing** — no public store entry yet. The Play Internal track is the next step for Android once EAS + Play service account are configured.
- **Cloud sync, multi-device, account system** — not in scope for v1.0.0. Pet state and chat history are local to each device.

## Install — Linux

```bash
# Option A: AppImage (no install)
chmod +x "Smart Pet Agent-1.0.0.AppImage"
./"Smart Pet Agent-1.0.0.AppImage" --no-sandbox

# Option B: deb (system install)
sudo dpkg -i smart-pet-agent_1.0.0_amd64.deb
sudo apt-get install -f   # resolve any missing deps (libgtk-3-0, libnss3, etc.)
smart-pet-agent
```

## Install — Android

```bash
# Enable USB debugging on the device, then:
adb install app-debug.apk
# Or to replace an existing install:
adb install -r app-debug.apk

# Launch:
adb shell am start -n ai.smartpet.agent/.MainActivity
```

## Install — Linux CLI / TUI

```bash
# From the monorepo root:
pnpm install --frozen-lockfile
pnpm --filter @smart-pet/cli build
pnpm --filter @smart-pet/tui build
node apps/cli/dist/index.cjs    # or: pnpm cli
node apps/tui/dist/index.js     # or: pnpm tui  (requires a real TTY)
```

## Reporting issues

Please file issues at https://github.com/<owner>/smart-pet-agent/issues with:
- OS + version (for desktop), or device + Android version (for mobile).
- The relevant log file (`~/.smart-pet-agent/agent.log` on desktop, `adb logcat | grep ai.smartpet.agent` on Android).
- Steps to reproduce.

## License

MIT. See [`LICENSE`](LICENSE).

## Provenance

- Linux AppImage + deb: built by the `desktop-publish-ubuntu` CI job on `ubuntu-latest`.
- Android debug APK: built by the `mobile-preview` CI job on `ubuntu-latest` via Expo's local prebuild (Firebase-free) + Gradle.
- All sources: <https://github.com/<owner>/smart-pet-agent> at tag `v1.0.0-alpha.1`.
