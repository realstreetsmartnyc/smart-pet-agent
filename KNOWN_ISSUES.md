# Known Issues — Smart Pet Agent v1.0.0

This file tracks known limitations, workarounds, and planned fixes for the current release.

## Desktop (v1.0.0)

### Voice is a scaffold
- `generateVoice` and `transcribeAudio` emit events but return empty strings.
- Real Piper/Whisper integration is planned for v1.1.0.
- **Workaround:** Use text chat. Voice state halos (`listening`, `thinking`) are visible in the pet overlay.

### Pet video packs not shipped
- The default pet (`default-nyc-orb`) uses a CSS canvas orb. No `.webm` video pack is included.
- `validatePetPack` warns on missing `.webm` for `engine: video` packs but passes for `engine: canvas`.
- **Workaround:** None needed — canvas orb is the shipped v1 experience.

### Linux deb packaging in containers
- `electron-builder --linux deb` may fail in Docker/container environments due to `fpm`/`bwrap` sandbox restrictions.
- **Workaround:** Build on a clean `ubuntu-latest` VM or use the `AppImage` target.

### xvfb trap in Parrot OS
- Running `xvfb-run --no-sandbox` inside Parrot OS containers may trap the Electron process.
- **Workaround:** Test on GitHub Actions `ubuntu-latest` or a clean VM.

### Windows screen capture requires ffmpeg
- `captureScreen` on Windows uses a PowerShell bitmap capture path. If it fails, it falls back to `ffmpeg gdigrab`.
- **Workaround:** Install ffmpeg and ensure it is on `PATH`.

## Mobile (v1.1.0-mobile-beta)

### EAS build in pnpm monorepo
- `eas build` may fail with `expo config --json` exit 1 due to Expo SDK 51 + pnpm workspace resolution.
- **Workaround:** Use the standalone export script: `bash scripts/export-mobile-standalone.sh`, then build in `/tmp/smart-pet-agent-mobile`.

### expo-sqlite prebuild compatibility
- `expo-sqlite` v14 has a known issue where `expo prebuild` cannot resolve `SQLiteDatabase` in some monorepo setups.
- **Workaround:** The standalone export script installs `expo-sqlite` v13, which resolves correctly.

### Mobile AgentLoop not wired
- The mobile app does not yet run the core `AgentLoop` on-device. Chat is simulated.
- **Planned:** Sprint 7 will wire the agent runtime or define a local-network bridge.

### Play Store signing
- The generated `android/app/build.gradle` signs release builds with the debug keystore.
- **Workaround:** Configure `eas.json` production signing with a real release keystore before uploading to Play Console.

## Reporting Issues

- Open a GitHub issue with steps to reproduce, OS, and app version.
- Attach `~/.smart-pet-agent/logs/runtime.log` on desktop.
- On mobile, use `adb logcat | grep smart-pet-agent` or Expo dashboard logs.
