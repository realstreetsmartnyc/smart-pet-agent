# Release Checklist — Publish Gates

Status: 2026-09-01 — private alpha / technical preview. Not public-release-ready.

This checklist is intentionally evidence-gated. A source test, scaffold, config file, string check, or local build attempt is not enough to call a platform publish-ready.

## Status Tags

- `[VERIFIED]` — directly observed in the current evidence window.
- `[LOCAL-ONLY]` — observed locally but not proven as a clean distributable artifact.
- `[SCAFFOLDED]` — structure exists, implementation or verification incomplete.
- `[BLOCKED]` — cannot be called ready until a known blocker is removed.
- `[DEFERRED]` — intentionally post-desktop or post-v1 work.

## Current Gates

- [x] Core source checks: `[VERIFIED]` recent `pnpm typecheck` and `pnpm test` evidence exists in the controlling publish plan.
- [x] Node-side native SQLite persistence: `[LOCAL-ONLY]` passes through a temporary Node ABI `137` rebuild.
- [x] Packaged Electron native SQLite: `[VERIFIED]` better-sqlite3 rebuilt for Electron `33.4.11` ABI `130`; `apps/electron/electron-builder.json` asarUnpack ships `better-sqlite3`+`bindings`+`file-uri-to-path`; e2e-electron.sh exits `agent.ready`.
- [x] Packaged permission persistence: `[VERIFIED]` e2e-electron.sh PASS (no `SMART_PET_TEST`, no in-memory fallback) — `scripts/e2e-electron.sh` history:2 + permission persist.
- [x] Packaged chat and permission IPC: `[VERIFIED]` e2e-electron.sh `chunks:11 provider:nous` + `permission set/list` exercised in packaged runtime.
- [x] Linux AppImage/deb: `[VERIFIED]` `apps/electron/build/Smart Pet Agent-0.1.0.AppImage` (108M) + `smart-pet-agent_0.1.0_amd64.deb` (76M) built on Parrot; `dpkg -i` install OK; both `/usr/bin/smart-pet-agent` and AppImage boot to `agent.ready`; `scripts/e2e-electron.sh` GREEN.
- [x] Linux CLI: `[VERIFIED]` `apps/cli` (v1.0.0) bundled to `apps/cli/dist/index.cjs` (97KB CJS) via `pnpm build` (esbuild). `bin: {"smart-pet": "./dist/index.cjs"}`. Runs (`node apps/cli/dist/index.cjs --help` → v1.0.0 banner + `agent.ready`).
- [x] Linux TUI: `[VERIFIED]` `apps/tui` (v1.0.0) bundled to `apps/tui/dist/index.js` (2.1MB ESM with `createRequire` banner shim) via `pnpm build` (esbuild). `bin: {"smart-pet-tui": "./dist/index.js"}`. Runs (detects non-TTY and prints helpful message).
- [x] Linux UI tokens: `[VERIFIED]` `@smart-pet/ui-tokens` v1.0.0 ships `tokens.css` (single-source design tokens, consumed by Electron renderer + TUI).
- [x] Linux desktop chat/permission IPC: `[VERIFIED]` `scripts/e2e-electron.sh` exercises `chunks:11 provider:nous` + `permission set/list` + history:2 persistence in the packaged runtime.
- [ ] Windows NSIS: `[BLOCKED]` source + icon.ico + `apps/electron/electron-builder.json` nsis config + `desktop-publish-windows` CI job ready; actual build/install/launch/upgrade/uninstall deferred to `windows-latest` runner (wine32:i386 unavailable in Parrot repos).
- [ ] macOS DMG: `[BLOCKED]` icon.iconset/ + `desktop-publish-macos` CI job (runs `iconutil -c icns`) ready; actual dmg build + codesign + notarize deferred to `macos-latest` runner.
- [x] Custom Pet Creator MVP: `[VERIFIED]` `packages/core/src/pet-creator.ts` (13.5KB) exports the public API: `safeIngestImage` (path-traversal guard + magic-byte MIME + size + allowed-MIME), `activatePetPack` (atomic install, `active.json` with `previous` for rollback), `deactivatePetPack` (rollback), `listInstalledPets`, `getInstalledPet`, `exportPetPack` / `writeExportToFile` / `importPetPack` (`.smartpet` JSON envelope, v1), `detectMimeByMagic`. `packages/core/src/pet-creator-mvp.test.ts` (9 tests) exercises the full flow: ingest → generate → validate → activate → list → export → import → re-activate → rollback + rollback-restores-previous-version. Re-exported from `@smart-pet/core`. Bug fixed in the process: `assertNoTraversal` was rejecting all absolute paths; now correctly rejects only `..` segments.
- [ ] Android: `[PARTIAL]` local debug APK `[VERIFIED]` — `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` 173,182,966 bytes (rebuilt Turn 11, Firebase-free), package `ai.smartpet.agent` v1.0.0, targetSdk 34, builds clean on Parrot. EAS config (`apps/mobile/eas.json` + `apps/mobile/app.json`) consistent; CI `mobile-preview` job wired with `openjdk-17-jdk` install. Data Safety form drafted (`docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md`, Firebase-free). Still `[BLOCKED]`: device grant/deny audit (G3.4 — needs physical device), EAS preview APK + production AAB + Play Internal (G3.5/G3.6 — needs EAS account + `EAS_TOKEN` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secrets), Play store assets (G3.7/G3.9).
- [ ] iOS: `[DEFERRED]` requires Apple Developer access, TestFlight/App Store setup, device tests, and signing evidence.
- [ ] Public release notes: `[BLOCKED]` must be rewritten only after artifact gates pass.
- [ ] Git tag/release: `[BLOCKED]` requires source boundary, clean staging decision, artifact evidence, and explicit user approval.

## Required Desktop Release Evidence

- Clean dependency install from the lockfile in a user-owned environment.
- Electron native dependency rebuild against Electron ABI `130`.
- Packaged app reaches `agent.ready` without test fallback.
- Chat stream, provider status, permission set/list, permission restart persistence, pet overlay, pet intent, and runtime log paths are verified.
- Linux install/launch evidence is recorded for AppImage/deb.
- Windows install/upgrade/uninstall evidence is recorded for NSIS.
- macOS DMG mount/launch/signing status is recorded.
- Release docs match the verified artifacts exactly.

## Required Marketing Release Evidence

- Waitlist/download URL is real and tested.
- Captions and pages say private alpha until public artifacts are verified.
- Screenshots and videos show real behavior or clearly labeled demo/alpha behavior.
- User explicitly approves each external post, launch page, Product Hunt schedule, GitHub release, and installer publication.

## Controlling References

- `docs/MASTER_PHASE_SPRINT_EXECUTION_PLAN_2026-09-01.md`
- `docs/PUBLISH_PLAN_ALL_PLATFORMS_2026-09-01.md`
- `docs/MARKETING_AUDIT_AND_SOCIAL_PLAN_2026-09-01.md`
