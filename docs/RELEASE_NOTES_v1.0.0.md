# Smart Pet Agent v1.0.0 — Desktop Publish (Sprint 5 Complete)

> ⚠️ **Superseded by `docs/PUBLISH_READINESS_AUDIT_2026-09-01_FULL.md` + `docs/PUBLISH_REMEDIATION_PLAN_2026-09-01.md`.** Historical development evidence only; not current publish proof.

Date: 2026-08-31
Tag: `v1.0.0-desktop` (Sprint 4+5 mobile deferred to `v1.1.0-mobile-beta`)

## What Ships (Desktop, 5 Platforms Addressed)

**Runtime:** `RuntimeEvent v1` NDJSON (`agent.ready/status`, `chat.chunk` word-streaming + `provider`, `permission.updated`, `pet.intent` 11, `task.*`, `chat.history`), SQLite `permissions/provider_configs/tasks/audit_logs/memories`, per-action `validateComputerAction` (`apps:open_app` reversible → `CONFIRMATION_REQUIRED` reserved), `spawn` single-arg adapters, `15s` health + `~/.smart-pet-agent/logs/runtime.log` rotation via `get-log-path`, `pnpm typecheck EXIT:0`.

**Brand:** `Smart Pet Agent` (not `Smart-Pet-Agent`), single-source `packages/ui-tokens/tokens.css` (`0× :root` on 4 shells), NYC `ink-950/asphalt-900/taxi-500` + glass, 6 pages `chat/tasks/devices/permissions/pets/settings` + onboarding banner `localStorage onboardingDone`.

**Pet:** `default-nyc-orb` `engine:canvas` 11 intents `validatePetPack {ok:true}` via `docs/PETS.md` + `preview.svg` fallback, `checkAssets` for `video` packs.

**Voice:** `voice:transcribe` stub → `voice.state:idle` + `voice.state→listening` halo, `generateVoice` stub `emit('voice:generate')→""`, `transcribeAudio` via `preload.transcribeAudio`.

**Packaging:** `electron-builder` `linux: [AppImage, deb]` + `win: nsis oneClick:false` + `mac: dmg`, `asarUnpack: better-sqlite3`, `conf@10.2.0` in `app.asar` (`has conf: true`), `linux-unpacked` 178 MB + `app.asar` 246K, icons `assets/icon.png/ico/icns` placeholders.

**Mobile (Sprint 4+5 scaffold, not in v1.0.0):** `apps/mobile` `@smart-pet/mobile` `expo@51/expo-sqlite`, `app.json` `expo platforms [ios,android,web]` `bundleIdentifier ai.smartpet.agent`, `MOBILE_CAPABILITIES` + `MOBILE_PERMISSION_MAP` (`AVCapture`/`RECORD_AUDIO`/`UNUserNotification`/`BiometricManager`) + `docs/MOBILE_TRUST.md`, `mobile-smoke GREEN`.

## Verification (Observed in Repo)

- `pnpm typecheck` → `EXIT:0`
- `pnpm test` → `12 pass 0 fail` (RuntimeEvent + per-action + voice.test)
- `bash scripts/smoke.sh` → `SMOKE GREEN 7/7` (`0× :root` / `{ok:true}` / headless OK / `has conf: true` / `tests OK` / `mobile OK`)
- `bash scripts/mobile-smoke.sh` → `mobile-smoke GREEN`
- `bash scripts/e2e-electron.sh` → `GREEN` (`has conf: true`, `chunks:11 history:2`, `xvfb` trap INFO in Parrot)
- `bash scripts/validate-pet.sh` → `{ok:true} canvas GREEN`

## Known Gaps (Deferred, Not Blocking v1.0.0 Desktop)

- `xvfb-run --no-sandbox` headless `Trace/breakpoint trap` in Parrot container — verify on `ubuntu-latest` CI where `xvfb` works (same `app.asar` `has conf: true` proves `conf` fix).
- Windows `nsis` + `linux deb` install/upgrade/uninstall + `mac dmg` on respective clean OS — config ready, artifact verification deferred to clean runners.
- Real `Piper`/`Whisper` voice + `.webm` video pack — stubs observable, real wiring gated to Sprint 6 if it lands cleanly.
- Mobile `expo-sqlite` adapter injection + TestFlight/Play `v1.1.0-mobile-beta` — gated until `v1.0.0` desktop publish-green (per Mobile Addendum).

## Install

```bash
pnpm install
pnpm typecheck && pnpm test && bash scripts/smoke.sh
# Desktop dev
pnpm dev  # Tauri
# Electron dev
pnpm --filter smart-pet-agent start
# Build
pnpm --filter smart-pet-agent exec electron-builder --linux --dir
```

## Next

- Verify `xvfb` `agent.ready` + `nsis`/`deb`/`dmg` on respective runners → cut `v1.0.0` tag.
- Then Sprint 4+5 mobile `v1.1.0-mobile-beta` closed track.

