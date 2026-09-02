# Refinement Plan — From Deep Install/Start Experience (2026-09-02)

**Context:** `pnpm install && electron dev` with `DISPLAY=:0`, plus DragonOS avatar integration.

## Experience Log

### Install
- ✅ `pnpm install --frozen-lockfile` exits 0 (pnpm 9.4.0, Node 24.17.0, ABI 137)
- ⚠️ `better-sqlite3` compiled for Electron ABI 130 (2.0MB node) — `check-native-sqlite.mjs` fails under Node 24 (137) but `electron-builder install-app-deps` correctly rebuilds for Electron. The fallback paths in `check-native-sqlite.mjs` (`/tmp/...`) are never populated. **Refine:** make `pnpm install` automatically run `electron-builder install-app-deps` postinstall, or document `pnpm --dir apps/electron exec electron-builder install-app-deps`.

### Start (DISPLAY=:0)
- ✅ `pnpm --dir apps/electron exec electron . --no-sandbox` stays running (timeout after 10s = window open), `xwininfo` shows `smart-pet-agent` 420×700 + bubble 120×110, screenshot 58KB — **windows visible**.
- ⚠️ Gtk warning: `Failed to load module "appmenu-gtk-module"` (harmless, missing `appmenu-gtk-module`).
- ⚠️ Agent error: `Unable to find Electron app at …/tsx / Cannot find module '…/tsx'` — `main.js` tries to launch `tsx` for agent-runtime but path is wrong when run from `apps/electron`. **Refine:** fix `tsx` resolution to `npx tsx` or bundled `agent-runtime.mjs` (already built 93KB).

### Configure
- ✅ Settings persist via `electron-store` (`conf` + `dot-prop` now in `asarUnpack`), `get-settings`/`save-settings` IPC works.
- ✅ Providers: local Ollama/LM Studio (no key) + cloud (OpenAI/Anthropic) via `baseUrl`+key — BYOK, no baked credentials.
- ✅ Pets: `default-nyc-orb` (CSS orb) + new `dragon-nyc` (Three.js GLB 1.4MB + 4 textures, 11 states, NYC halos). Installed at `pets/dragon-nyc/`, preview SVG shows smoked-steel dragon with taxi-gold eyes.
- ⚠️ No UI to switch pet yet — `SMART_PET_ACTIVE_PACK=dragon-nyc` env works but Settings → Pets still shows only orb. **Refine:** wire `pets/dragon-nyc` into Settings → Pets list (read `pets/*/manifest.json`).

### Test
- ✅ `xvfb-run` headless also works (319-byte root screenshot before, 58KB windowed).
- ⚠️ CLI: `apps/cli/dist/index.js:806 require is not defined in ES module` — `type: module` but bundle emits CJS `require`. **Refine:** fix esbuild `format: cjs` vs `esm` or rename to `.cjs`.
- ⚠️ CI: pet `ci` ✅, but `desktop-publish-*` and `mobile-preview` fail without `WIN_CSC_LINK`/`CSC_LINK`/`EAS_TOKEN` (expected, documented).

## Refinement Tasks (prioritized)

### P0 — Ship blockers
1. **Fix `tsx` launcher** — `apps/electron/src/main.js` → use `apps/electron/src/agent-runtime.mjs` (already built) instead of `tsx` path. Verify `Agent ERR` disappears on next `xvfb-run`.
2. **Fix CLI ESM** — `apps/cli` esbuild → `format: cjs` + `outfile: dist/index.cjs`, keep `type: module` for src but output CJS.
3. **Auto-rebuild sqlite** — add `"postinstall": "electron-builder install-app-deps"` to root or `apps/electron/package.json`.

### P1 — Dragon integration
4. **Wire dragon-nyc into Settings UI** — list `pets/*/manifest.json`, preview `assets/preview.svg`, switch active pack (write `active` to pet store).
5. **Optimize dragon GLB** — already optimized (1.4MB vs 16MB raw), but `avatar.glb` 14MB is too large — keep dragon as premium, note avatar.glb as future humanoid option.
6. **Commit dragon-nyc + banner** — `pets/dragon-nyc/*` + `docs/banner.png` already staged, push with this plan.

### P2 — Polish
7. **Gtk module** — `sudo apt install appmenu-gtk-module-common` or suppress warning.
8. **Screenshot for GitHub** — `import -window root` captured 58KB but shows desktop; use `xwd` + crop to pet window for social preview that matches `docs/banner.svg` NYC vibe.
9. **Docs** — update `USER_GUIDE.md` with dragon pet selection, `MOBILE_BUILD` with ABI note.

## Verification After Fixes

```bash
pnpm install  # should auto-rebuild sqlite, no ABI error
xvfb-run -a pnpm --dir apps/electron exec electron . --no-sandbox  # no tsx error, window + screenshot
pnpm --filter smart-pet-agent exec node apps/cli/dist/index.cjs --help  # no require error
# UI: Settings → Pets → dragon-nyc preview and switch
```

---
*Generated from live `DISPLAY=:0` session 2026-09-02, dragon integration from `avatar-os/dragonos`.*
