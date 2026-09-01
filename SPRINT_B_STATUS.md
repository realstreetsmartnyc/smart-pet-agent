Sprint B (2026-08-31) — superseded.
State: HEAD advanced beyond 749fae1 — now includes pnpm typecheck fix, permission-policy tests, tokens single-source, pet 11-intent canvas fallback, Electron packaging (linux-unpacked), smoke gate 5/5 GREEN.
Tauri: visual shell prototype deferred for v1 — Electron is the v1 runtime target. agent_bridge.rs returns explicit "deferred for v1" errors, not echo/fake paths.
Electron: requires `conf` fix (added to dependencies) — rebuild verifies `Cannot find module 'conf'` resolved; packaged boot still requires manual headless launch check.
Pet: default-nyc-orb engine=canvas, CSS orb fallback; validator now optionally checks assets for video packs via checkAssets.
