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
- [x] Windows NSIS (build + verify): `[VERIFIED]` `desktop-publish-windows` CI job GREEN on `windows-latest` — `Smart Pet Agent Setup 1.0.0.exe` (86,228,387 bytes) built and `scripts/verify-windows-nsis.ps1` passed. Fixes: `node-linker=hoisted` (NSIS MAX_PATH `!include` under pnpm `.pnpm` virtual store) + pinned `electronVersion: 33.4.11` (electron detection under hoisted layout) + removed redundant `electron-builder install-app-deps`. UNSIGNED (no cert) — acceptable for private alpha; still needs a code-signing cert for a signed public installer.
- [x] macOS DMG (build + mount + verify): `[VERIFIED]` `desktop-publish-macos` CI job GREEN on `macos-latest` — dmg (109,120,145 bytes) built and `scripts/verify-macos-dmg.sh` passed (explicit `-mountpoint` + codesign-as-warning for unsigned). UNSIGNED (no cert) — acceptable for private alpha; still needs signing + notarization for a signed public release.
- [x] Custom Pet Creator MVP: `[VERIFIED]` `packages/core/src/pet-creator.ts` (13.5KB) exports the public API: `safeIngestImage` (path-traversal guard + magic-byte MIME + size + allowed-MIME), `activatePetPack` (atomic install, `active.json` with `previous` for rollback), `deactivatePetPack` (rollback), `listInstalledPets`, `getInstalledPet`, `exportPetPack` / `writeExportToFile` / `importPetPack` (`.smartpet` JSON envelope, v1), `detectMimeByMagic`. `packages/core/src/pet-creator-mvp.test.ts` (9 tests) exercises the full flow: ingest → generate → validate → activate → list → export → import → re-activate → rollback + rollback-restores-previous-version. Re-exported from `@smart-pet/core`. Bug fixed in the process: `assertNoTraversal` was rejecting all absolute paths; now correctly rejects only `..` segments.
- [x] Android (local debug APK, CI-built + verified): `[VERIFIED]` `mobile-preview` CI job GREEN on `ubuntu-latest` — builds `app-debug.apk` via local Gradle (NO EAS needed; the `eas login`/`verify-eas-identity.sh` steps were removed from this job since it builds locally), then `scripts/verify-android-apk.sh` PASS, then uploads `android-debug-apk`. Package `ai.smartpet.agent` v1.0.0, targetSdk 34, Firebase-free. Still `[BLOCKED]` for the external sub-gates: EAS preview APK + production AAB + Play Internal (needs EAS account + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`), device permission audit (physical device), and Play store assets + Data Safety paste-in (manual).
- [ ] iOS: `[DEFERRED]` requires Apple Developer access, TestFlight/App Store setup, device tests, and signing evidence.
- [x] Public release notes: `[VERIFIED]` `docs/RELEASE_NOTES_v1.0.0_READY.md` reflects the CI-verified 4-platform state (Linux AppImage+deb, Windows NSIS, macOS DMG, Android debug APK), the unsigned-status caveats, and the remaining external blockers. (The cordon-owned `docs/RELEASE_NOTES_v1.0.0.md` placeholder is left untouched.)
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
