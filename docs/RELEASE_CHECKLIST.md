# Release Checklist — Publish Gates

Status: 2026-09-02 — Phase 0 GREEN. Desktop packaging and mobile builds require CI runners.

## Status Tags
- **[VERIFIED]** — Observed on Parrot host
- **[SUPPORTED]** — Code complete, not yet built/verified on clean runner
- **[SCAFFOLDED]** — Structure exists, implementation incomplete
- **[DEFERRED]** — Post-v1 or blocked by external dependency

---

- [x] A Architecture: [VERIFIED] RuntimeEvent v1, SQLite, adapter, health recovery, `pnpm typecheck EXIT:0`, per-action policy + `logAudit`
- [x] B Brand: [VERIFIED] tokens single-source (`./tokens.css` only, `0× :root` on 4 shells), NYC palette on all windows
- [x] C Embodiment: [VERIFIED] `default-nyc-orb` `engine:canvas` `validatePetPack {ok:true}` 11 intents, `preview.svg` fallback
- [x] D Trust: [VERIFIED] deny-by-default + `validateComputerAction` + `logAudit` per `computer_action`
- [x] E Packaging: [VERIFIED] Linux `electron-builder` AppImage+deb built/installed/launched; `asarUnpack` ships `better-sqlite3`+`bindings`+`file-uri-to-path`; `conf`+`dot-prop` in `app.asar` — Windows/Mac still [SUPPORTED] CI
- [x] F Smoke gate: [VERIFIED] `bash scripts/smoke.sh` 7/7 GREEN (typecheck + validate-pet + headless + tests + mobile)
- [ ] G Mobile: [SCAFFOLDED] Android/iOS configs complete, EAS projectId placeholder, no device test evidence
- [x] H Desktop artifacts: [VERIFIED] Linux packaged boot GREEN (`e2e-electron.sh`: `agent.ready`, `chunks:11 provider:nous history:2`, permission persist PASS; `dpkg -i` install + AppImage launch under xvfb)
- [ ] I Windows: [SUPPORTED] NSIS config ready, `icon.ico` 7-size (256→16) verified; NSIS build + clean-VM install/upgrade/uninstall pending `windows-latest`
- [ ] J Mac: [SUPPORTED] DMG config ready, `icon.iconset` (10 frames) prepared for CI `iconutil`; dmg + codesign/notarize pending `macos-latest`
- [ ] K iOS: [DEFERRED] Blocked by Apple Developer account ($99/yr)

---

## Phase 0 Exit Gate (2026-09-02) — ✅ GREEN
- `pnpm typecheck` → `EXIT:0` ✅
- `pnpm test` → `15 pass 0 fail` ✅
- `bash scripts/validate-pet.sh` → `GREEN` ✅
- `bash scripts/mobile-smoke.sh` → `GREEN` ✅

## Remaining Blockers
1. Windows NSIS build + clean-VM install/upgrade/uninstall (requires `windows-latest`)
2. Mac dmg build + codesign/notarize (requires `macos-latest`)
3. EAS projectId placeholder → real UUID (requires expo.dev registration)
4. Android device grant/deny audit + Play Internal (requires device + Play Console)
5. Apple Developer account for iOS ($99/yr) + TestFlight

## Current Evidence (2026-09-02, live on Parrot host)
- `pnpm typecheck` → `EXIT:0`
- `pnpm test` → `15 pass 0 fail`
- `bash scripts/smoke.sh` → `SMOKE GATE GREEN` (7/7)
- `bash scripts/validate-pet.sh` → `{ok:true} canvas (checkAssets) GREEN`
- `bash scripts/mobile-smoke.sh` → `GREEN`
- `CI=1 pnpm install --frozen-lockfile` → PASS (2m28s; `pnpm.onlyBuiltDependencies` allowlist)
- `node scripts/check-native-sqlite.mjs` → `{ok:true}`
- `bash scripts/e2e-electron.sh` → GREEN (`agent.ready`, `chunks:11 provider:nous history:2`, permission persist PASS)
- `build/Smart Pet Agent-0.1.0.AppImage` (108M) + `build/smart-pet-agent_0.1.0_amd64.deb` (76M) built
- `sudo dpkg -i smart-pet-agent_0.1.0_amd64.deb` → `Status: install ok installed`; `/usr/bin/smart-pet-agent` boots + logs `agent.ready`
- AppImage `--appimage-extract-and-run` under xvfb → `agent.ready` (count 1)
- `apps/electron/assets/icon.ico` → 7-icon ICO (256/128/64/48/32/24/16)
- `apps/electron/assets/icon.iconset` → 10 frames ready for `iconutil`
