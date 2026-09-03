# Smart Pet Agent v1.0.0 — Release Notes (public-ready draft)

> **Status:** release notes reflecting the CI-verified state as of 2026-09-03.
> All four desktop installers (Linux AppImage+deb, Windows NSIS, macOS DMG)
> build and verify on clean CI runners. Android debug APK is verified locally.
> iOS, Play Store, App Store, and code signing remain external blockers.
> **This is not yet a published v1.0.0 tag.**

## What shipped (CI-verified)

| Platform | Artifact | Size | Signing |
|---|---|---|---|
| Linux | `Smart Pet Agent-1.0.0.AppImage` + `smart-pet-agent_1.0.0_amd64.deb` | ~193 MB (installers) | unsigned |
| Windows | `Smart Pet Agent Setup 1.0.0.exe` (NSIS) | ~86 MB | unsigned |
| macOS | `Smart Pet Agent-1.0.0.dmg` | ~109 MB | unsigned |
| Android | `app-debug.apk` (debug) | ~173 MB | debug-signed |

- **Linux**: built + e2e-verified on `ubuntu-latest` (`desktop-publish-ubuntu` GREEN).
- **Windows**: built + verify-script passed on `windows-latest` (`desktop-publish-windows` GREEN).
- **macOS**: built + mounted + verify-script passed on `macos-latest` (`desktop-publish-macos` GREEN).
- **Android**: local debug APK built on Parrot; `verify-android-apk.sh` PASS; `apksigner verify` PASS (v1+v2). EAS preview + Play Internal pending `EAS_TOKEN` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.

## Verified behavior (all CI)

- `pnpm typecheck` (core + cli + tui) — exit 0
- `pnpm test` — 24/24 pass
- `bash scripts/smoke.sh` — SMOKE GATE GREEN (7/7)
- `bash scripts/e2e-electron.sh` — GREEN (agent.ready, chunks, history, permission persist)
- `scripts/verify-android-apk.sh` — PASS
- `apksigner verify` — PASS (v1 + v2)

## Privacy & data (no-baked-credentials posture)

- **Local-first**: pet state, permissions, chat history stored on-device (SQLite).
- **Your-AI-your-endpoint**: outbound network only to the provider baseURL the user configures; no bundled provider credentials.
- **No telemetry / ads / tracking SDKs**: source scan for analytics/crashlytics/getMessaging = zero matches.
- **No Firebase / third-party project connections**: Turn 11 removed all Firebase wiring; the `C2DM` permission is library-level from `expo-notifications`.
- Play Console Data Safety form: `docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md`.

## Known limits (honest, not regressions)

- **Unsigned desktop installers**: Windows/macOS/Linux installers are unsigned. OSes will warn on first run. A code-signing cert (and macOS notarization) is required for a signed public release.
- **iOS not shipped**: Apple Developer enrollment + App Store Connect + TestFlight remain external.
- **Android store not shipped**: EAS account + Play service account remain external.
- **Custom Pet Creator MVP**: full flow verified (ingest → generate → validate → activate → list → export/import → rollback); a marketplace is post-v1.0.0.

## Install

- **Linux**: `chmod +x "Smart Pet Agent-1.0.0.AppImage" && ./"Smart Pet Agent-1.0.0.AppImage"` or `sudo dpkg -i smart-pet-agent_1.0.0_amd64.deb`
- **Windows**: run `Smart Pet Agent Setup 1.0.0.exe` (SmartScreen will warn — unsigned)
- **macOS**: open `Smart Pet Agent-1.0.0.dmg`, drag to Applications (Gatekeeper will warn — unsigned/not notarized)
- **Android**: `adb install app-debug.apk`

## License

MIT. See `LICENSE`.

## Funding

`docs/Monetization.md` — donations (GitHub Sponsors / Open Collective / Ko-fi) active now; premium pet packs + managed sync + premium support post-v1.0.0. No dual-license, no ads, no telemetry.
