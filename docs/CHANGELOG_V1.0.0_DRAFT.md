# Changelog

All notable changes to Smart Pet Agent are documented here. This file follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/) (v1.0.0 entry is a
release-notes style summary; adopt the structured format from v1.0.1 onward).

## [1.0.0] — 2026-09-02 (unreleased — held for tag/release approval)

### Platforms

- **Linux desktop** (Electron 33.4.11): AppImage + deb, install + e2e verified
- **Linux CLI** (`smart-pet`): esbuild CJS bundle, self-contained
- **Linux TUI** (`smart-pet-tui`): Ink-based, esbuild ESM bundle
- **Android** (React Native / Expo SDK 51): local debug APK built + verified
  (Firebase-free, targetSdk 34)
- **Windows / macOS**: source + CI jobs ready; actual installers deferred to
  `windows-latest` / `macos-latest` runners (need signing secrets)

### Features

- Multi-provider AI manager with provider ping + timeout hardening
- Agent loop with streaming chat, permission persistence, chat history
- Custom Pet Creator MVP: safe image ingestion, validation, activation,
  `.smartpet` export/import, rollback
- Single-source design tokens (`@smart-pet/ui-tokens`)

### Fixed

- Firebase wiring removed end-to-end (plugins, deps, build files, config files)
  — no baked-in third-party project connections
- `assertNoTraversal` false positive (rejected all absolute paths; now rejects
  only `..` segments)
- `jlink` build failure (AGP `androidJdkImage` transform) fixed by installing
  `openjdk-17-jdk`
- CLI/TUI `dist` files that imported TypeScript source at runtime — now bundled
  with esbuild into self-contained JS
- `pnpm-lock.yaml` synced (removed orphan `expo-firebase-core` reference)

### Known limits (documented, not regressions)

- Windows NSIS, macOS DMG, and iOS builds remain blocked on external
  credentials/CI runners (see `docs/PUBLISH_RUNBOOK_v1.0.0.md`)
- Android EAS preview + production AAB + Play Internal remain blocked on EAS +
  Play service-account secrets
- Android device permission audit (G3.4) needs a physical device

### Verification

- `pnpm typecheck` exit 0
- `pnpm test` 24/24 pass
- `bash scripts/smoke.sh` SMOKE GATE GREEN (7/7 stages)
- `bash scripts/e2e-electron.sh` GREEN
- `scripts/verify-android-apk.sh` PASS
- `apksigner verify` PASS (v1 + v2 schemes)
- No-baked-credentials scan clean
