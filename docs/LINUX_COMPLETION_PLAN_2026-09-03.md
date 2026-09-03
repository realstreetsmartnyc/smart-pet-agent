# Linux (Debian/Ubuntu) Completion Plan — Smart Pet Agent

**Date:** 2026-09-03 | **Host:** Parrot 7.3 (Debian 13.5, Linux 7.0.13) | **Node:** v24.17.0 (nvmrc wants 20) | **Electron:** 33.4.11 (ABI 130) | **Node ABI:** 137 (24) | **Branch:** master + 4 audit workers

**North Star:** All 4 forms — CLI, TUI, GUI/UI (Chat), Electron — fully working on Debian/Ubuntu, with no critical broken, and verified via evidence (exit codes, artifacts, screenshots, xwininfo).

---

## Audit Summary (collated from 4 workers, 2026-09-02)

### CLI (audit-cli)
- **System:** Parrot 7.3 Debian, Node 24.17 (drift: .nvmrc 20), pnpm 9.4.0 — ✅
- **Install:** `pnpm install --frozen-lockfile` ✅ Done 3.8s, `better-sqlite3` 2.0M ELF, fallback `/tmp/better-sqlite3-build` 2.1M
- **Build:** `esbuild --bundle --platform=node --target=node20 --format=cjs --outfile=dist/index.cjs` ✅ (esbuild cjs)
- **Run:** `node dist/index.cjs --help` → no usage (only banner), `--version` shows v1.0.0 banner, `SMART_PET_ALLOW_IN_MEMORY_FALLBACK=1 node dist/index.cjs hello` → `All AI providers failed` (expected without local Ollama), interactive `echo "help"| node` → `help` + `state` + `memory` commands work, but `readline` closed error on `printf "help\nstate\n"` burst; `tsc --noEmit` ✅
- **Broken:** `.nvmrc` drift, `help` parser gap, native SQLite fallback wiring, provider wiring needs live Ollama/LiteLLM

### TUI (audit-tui)
- **System:** Debian 13.5, Node 24.17, pnpm 9.4.0, `DISPLAY=:0`, `TERM=xterm-256color`, `tty` not a tty in harness, `script -q` gives `true true` ✅
- **Install/Build:** `pnpm --filter @smart-pet/tui` ✅ (2.2M dist, ESM banner, `node --check` pass)
- **Run:** headless → fallback "TUI requires a TTY — use CLI" ✅, TTY via `script` → Ink UI renders `✓ Agent ready` ✅, `DISPLAY` irrelevant ✅
- **Typecheck:** `tsc --noEmit` ✅, no TUI tests ❌
- **Broken (6):**
  1. Peer `react 18.2.0` vs `react-reconciler@0.29.2 wants ^18.3.1` — WARN every install
  2. No TUI tests
  3. Burst/paste `help\r` as single chunk → `key.return` false, command never executes (char-by-char works, burst fails)
  4. `\n` vs `\r` — TUI checks `key.return` (\r) but `\n` maps to `enter`, `echo` piped `\n` won't trigger
  5. Node drift `.nvmrc` 20 vs 24
  6. `Ctrl+C` exit not verified in pty

### GUI/UI (audit-gui)
- **System:** Wayland primary + XWayland `:0`, `kwin_wayland` 6.3.6, `xdpyinfo` 1920×1080, Electron will run via XWayland ✅
- **Build:** `dist/chat.html` 35K (803l), `index.html` 28K, `three/` 9.8M, `pets/` 34M, AppImage 147M/108M, deb 151M ✅
- **Features:** provider dropdown 8 presets (ollama 11434, lmstudio 1234, litellm 4000, openai, anthropic, google, archon 8052, custom) ✅, Pets 4 panels (grid 1fr 1fr, 5 .panel) + `bindPetsPickable()` ✅ but double-binding bug, toolbar hide/show ✅ but duplicated, hitbox `B=0.62` triple-synced ✅
- **Run:** file:// and http outside Electron correctly fail (empty `electronAPI`, `getGatewayHealth is not a function`) — not a bug; inside Electron wiring exists (`providersList/save`, `permissions`, `telemetry`, `settings`) but live test not executed
- **Test:** headless Puppeteer 420×700 exact as spec, `var electronAPI` fallback correct (single `var`), importmap correct
- **Broken (8):**
  1. **CRITICAL** Three.js `three.core.js` missing — `dist/three/three.module.js` imports `./three.core.js` 404 → GLB pets fail
  2. **HIGH** Duplicate event listeners in chat.html — `petToggleBtn`/`petHideBtn` + `bindPetsPickable()` added TWICE (orphaned outside bootstrap + inside), tail duplicated
  3. **HIGH** Bootstrap `getGatewayHealth` unguarded — throws when preload absent → aborts `renderPermissions()` + pickable binding
  4. **MEDIUM** Provider test stub — only HEAD ping, defers live model ping
  5. **MEDIUM** Penguin 26M huge — bloats AppImage
  6. LOW No CSP meta
  7. LOW linux icon folder vs file
  8. LOW Debian version drift note

### Electron (audit-electron)
- **System:** Parrot 7.3, Node ABI 137 vs Electron ABI 130 dual-ABI confirmed, `ELECTRON_RUN_AS_NODE=1 electron -e require('better-sqlite3')` → OK (2.0M ELF), `node -e require` → ERR_DLOPEN_FAILED 130 vs 137 — fallback at `/tmp` 2.1M needed
- **Install:** `electron-builder install-app-deps` ✅ 2.0M BuildID a360bf, unpacked copy same 2.0M at `build/linux-unpacked/resources/app.asar.unpacked/...`
- **Build:** `build-agent-runtime.mjs` 94K 41ms ✅, `electron-builder --linux` 255s → linux-unpacked 337M, AppImage 147M, deb 220M, asar 64M ✅
- **Run:** `DISPLAY=:0 timeout 10 electron . --no-sandbox --disable-gpu --enable-logging` → PIDs 1859063, warnings `appmenu-gtk-module` (non-fatal), 3x CSP unsafe-eval, providers ready (nous etc), no ERR_DLOPEN, clean SIGTERM; `xvfb-run -a` → xwininfo 420x700+430+162 (chat), 120x110+580+457 (bubble), 230x225+1030+779 (pet overlay), screenshot 13K → verified
- **Test:** `scripts/e2e-electron.sh` GREEN EXIT 0 (unit harness 11 chunks, permission persist PASS) but hidden `Uncaught SyntaxError: Identifier 'electronAPI' has already been declared` 3x per run (chat:476, index:152, bubble:58) — e2e grep timing race lets it pass; `verify-macos-dmg.sh` FAIL (not WARN) on Linux — should exit 0; `check-native-sqlite.mjs` Node 137 ok via fallback, Electron 130 ok
- **Broken (8):**
  1. CRITICAL Dual-ABI hard-link — pnpm hard-link breaks Node test (inode 34935792 shared)
  2. Packaged `electronAPI` redeclaration 3x SyntaxError
  3. verify-macos-dmg.sh should WARN on Linux not FAIL
  4. appmenu-gtk-module warning — export GTK_MODULES=""
  5. tsx isolation — apps/electron/node_modules/.bin/tsx missing, dev relies on root
  6. GPU FATAL on shutdown — trap SIGTERM in main.js
  7. Insecure CSP (unsafe-eval)
  8. Build 255s slow — use deb-only for CI

---

## Prioritized Completion Plan

### P0 — Critical (block release, break core)

| ID | Form | Issue | Fix Owner | Steps | Acceptance |
|----|------|-------|-----------|-------|------------|
| P0-1 | GUI/Electron | `three.core.js` 404 → GLB pets fail | GUI | Copy `node_modules/three/build/three.core.js` + `three.core.min.js` to `dist/three/`; add importmap fallback; verify `import * as THREE from './three/three.module.js'` loads without 404 (headless + Electron file://) | `dist/three/three.core.js` exists (600K+), headless index.html no 404, Electron overlay shows Three canvas |
| P0-2 | Electron/GUI | `electronAPI` redeclaration 3x SyntaxError | Electron/GUI | Change `const/let electronAPI` → `var electronAPI = window.electronAPI || {}` in all 3 dist HTMLs (index, chat, bubble); add `var` guard; `node --check` pass, e2e grep no longer finds `already been declared` | `node --check dist/*.html` (via `npx html-validate` or `node --check` on extracted script), e2e log no SyntaxError |
| P0-3 | Electron/CLI | Dual-ABI hard-link breaks Node | Electron/CLI | Dual-ABI strategy: `electron-builder install-app-deps` for Electron (130) + separate `node-gyp rebuild` for Node (137) with `/tmp` fallback; document `scripts/ensure-native.sh` idempotent; `check-native-sqlite.mjs` ok for both | `node -e require('better-sqlite3')` ok (137) + `ELECTRON_RUN_AS_NODE=1 electron -e require('better-sqlite3')` ok (130); `ls -li` inodes differ or fallback works |

### P1 — High (break UX, block publish)

| ID | Form | Issue | Fix Owner | Steps | Acceptance |
|----|------|-------|-----------|-------|------------|
| P1-1 | GUI | Duplicate listeners in chat.html | GUI | Remove orphaned `petToggleBtn`/`petHideBtn` + `bindPetsPickable()` outside bootstrap; keep only inside `bootstrap()` with `{once:true}` or dedup `removeEventListener` | Click pet panel once → one `setActivePet` call (not double), toolbar buttons fire once |
| P1-2 | GUI | Bootstrap `getGatewayHealth` unguarded | GUI | Wrap `await electronAPI.getGatewayHealth()` in `try/catch` → fallback "offline / pending", still calls `renderPermissions()` + `bindPetsPickable()` | file:// preview shows permissions/telemetry placeholders, no PageError |
| P1-3 | TUI | Burst/paste `help\r` as single chunk fails | TUI | Fix `useInput` handler: if `input.length>1`, iterate chars or split `\r`/`\n`, handle `input.includes('\r')`; add guard for paste | `script -q -c "printf 'help\r' | pty"` → `Commands:` appears, `help\n` also works |
| P1-4 | Electron | `verify-macos-dmg.sh` FAIL on Linux | Electron | Early exit: `if [ "$(uname)" != "Darwin" ]; then echo "WARN: no dmg on Linux"; exit 0; fi` before `hdiutil` | `bash scripts/verify-macos-dmg.sh` on Linux → exit 0, CI green |
| P1-5 | TUI | Peer `react 18.2.0` vs `reconciler wants 18.3.1` | TUI | Pin `react` to `^18.3.1` in `apps/tui/package.json` (and root if hoisted), `pnpm install --frozen-lockfile` regen, verify Ink 5.2.1 still compatible | `pnpm install` shows no peer warn; `pnpm --filter tui dev` still renders |

### P2 — Medium (polish, publish block if not fixed)

| ID | Form | Issue | Fix Owner | Steps | Acceptance |
|----|------|-------|-----------|-------|------------|
| P2-1 | TUI | No TUI tests, `\n` vs `\r`, Node drift | TUI | Add `ink-testing-library` or `node-pty` + `script` tests for non-TTY fallback, TTY render, `help`/`state`, backspace, `exit`; normalize Enter to accept both `return`/`enter`; update `.nvmrc` to 24 or enforce CI to use 20 consistently | New tests exist, `\n` triggers as `\r`, `.nvmrc` matches active Node |
| P2-2 | GUI/Electron | Provider test stub (HEAD ping only) | GUI | Wire `providers:test` to `AgentManager.ping` (ollama `/api/tags`, openai `/v1/models`) | `Test` button shows live model ping result |
| P2-3 | CLI/TUI | `.nvmrc` drift 20 vs 24 | CLI/TUI | Update `.nvmrc` to `24` and `engines.node` to `>=20` or `>=24` consistently, or set CI matrix to use 20; document target node20 in esbuild is ok | `cat .nvmrc` matches `node --version` major, CI matrix aligns |
| P2-4 | Electron | `appmenu-gtk-module` warning | Electron | `export GTK_MODULES=""` in `scripts/e2e-electron.sh` and `main.js` launch wrapper, or install `appmenu-gtk-module-common` doc note | No `Failed to load module appmenu-gtk-module` in logs |
| P2-5 | Electron | Build 255s slow | Electron | Use `electron-builder --linux --config.directories.output=build --linux.target=deb` for CI (skip AppImage) or cache `~/.cache/electron` | CI `build:linux` < 90s |

### P3 — Low (nice to have)

| ID | Form | Issue | Steps | Acceptance |
|----|------|-------|-------|------------|
| P3-1 | GUI | No CSP meta | Add `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">` to chat/index/bubble.html | Headers present, no unsafe-inline blocking |
| P3-2 | GUI | `linux.icon: assets/icons` folder vs file | Change to `assets/icon.png` in `electron-builder.json` or document folder allowed | Canonical path or doc note |
| P3-3 | CLI | `help` parser gap, `memory`/`permissions` wiring | Add `usage`/`help`/`version` flags to CLI parser, wire `SMART_PET_ALLOW_IN_MEMORY_FALLBACK` correctly | `node dist/index.cjs --help` shows usage |

---

## Verification Matrix (how to prove Linux completion)

| Form | Command | Expected | Evidence |
|------|---------|----------|----------|
| CLI | `pnpm --filter @smart-pet/cli build && node dist/index.cjs --help` | usage shown | stdout contains `Usage:` |
| CLI | `SMART_PET_ALLOW_IN_MEMORY_FALLBACK=1 node dist/index.cjs hello` | `Agent ready`, no providers failed crash | exit 0, log has `Agent ready` |
| TUI | `script -q -c "pnpm --filter tui dev" /dev/null` | Ink UI `Agent ready`, `You > █` | screenshot/ log |
| TUI | `printf 'help\r' \| pty` | `Commands:` | log has `Commands:` |
| GUI | `file:// dist/chat.html` + `importmap three.core.js` | no 404, Three loads | console no `three.core.js` 404 |
| GUI | `pet-panel click` | one `setActivePet` | log has single call |
| Electron | `pnpm --dir apps/electron exec electron-builder install-app-deps && ELECTRON_RUN_AS_NODE=1 electron -e "require('better-sqlite3')"` | ok 130 | exit 0 |
| Electron | `xvfb-run -a electron . --no-sandbox --disable-gpu` → xwininfo | 420x700 chat, 230x225 pet | `xwininfo` + screenshot 13K |
| Electron | `bash scripts/e2e-electron.sh` | GREEN, no SyntaxError | log has `GREEN`, no `already been declared` |
| CI | `gh run list` | all green | status success |

---

## Execution Order

1. **P0-1 + P0-2 + P0-3** in parallel (blocks everything) — estimated 30 min
2. **P1-1 + P1-2 + P1-4 + P1-5** in parallel — estimated 20 min
3. **P2** polish + **P3** low — estimated 30 min
4. **Final verification matrix** — run all commands, collect evidence — estimated 15 min
5. **Push → CI green → tag → release** — estimated 10 min

Total: ~105 min to full Linux completion.

*This plan is the single source of truth for Linux. Every audit finding has a P0-P3 owner, steps, and acceptance. Re-run audits after fixes to confirm green.*
