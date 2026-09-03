# Smart Pet Agent — Master Execution Plan

**Generated:** 2026-09-02 21:17
**Scope:** smart-pet-agent (primary) + smart-apple-dev (secondary)
**North Star:** Ship a polished, working, monetizable open-source AI pet agent — UI complete, avatars render, runtime stable, CI green, and publicly released.

---

## Goal Hierarchy (top-down)

```
G0  Runtime Health          <- everything depends on this
G1  UI Completeness         <- settings/providers/pets/overlay
G2  Avatar System           <- 4 pets render & switch correctly
G3  Test & QA               <- all tests + install/start verified
G4  CI/CD                   <- all jobs green (desktop/mobile publishes)
G5  Publish & Monetization  <- public GitHub, docs, pricing, launch
G6  Post-launch Growth      <- sponsors, cloud build, LLM gateway
```

---

## G0 — Runtime Health (P0, blocking)

**Objective:** App launches and the agent runtime stays alive (no "Runtime stopped with code 1").

**Sub-goals:**
- [x] G0.1 Diagnose root cause: `better-sqlite3` ABI mismatch (Electron 33 = ABI 130 vs Node 24 = ABI 137)
- [ ] G0.2 Establish dual-ABI build strategy (Electron 130 + Node 137 coexist)
- [ ] G0.3 Fix dev-mode runtime spawn (`node --import tsx packages/core/src/index.ts`, not Electron binary)
- [ ] G0.4 Verify `pnpm --filter smart-pet-agent exec electron . --no-sandbox --disable-gpu` runs with runtime ok
- [ ] G0.5 Add postinstall auto-rebuild (`electron-builder install-app-deps` for packaged, `node-gyp` for Node)
- [ ] G0.6 Write `scripts/ensure-native.sh` that rebuilds both ABIs idempotently

**Acceptance criteria:**
- App window opens, status shows `runtime: running` (not `stopped with code 1`)
- `node scripts/check-native-sqlite.mjs` -> ok:true nodeAbi:137
- Electron runtime -> ok:true nodeAbi:130
- No manual `cp` of `.node` files required after fresh `pnpm install`

**Blocker:** pnpm hard-links one `better_sqlite3.node`; Electron and Node need different ABIs.

**Status:** IN PROGRESS — module now 2.1M (Node 137), Electron 130 version must be preserved separately.

---

## G1 — UI Completeness (P0)

**Objective:** Settings menu, providers, and pets are fully usable; no overlay glitch.

**Sub-goals:**
- [x] G1.1 Settings page: provider dropdown with 8 preconfigured presets (Ollama/LM Studio/LiteLLM/OpenAI/Anthropic/Google/Archon/Custom) + baseURL/model/apiKey fields — patched in dist/chat.html
- [ ] G1.2 Wire providers:test and providers:activate IPC (preload + main) — currently missing
- [ ] G1.3 Persist active provider via saveSettings({provider}) and show active state
- [x] G1.4 Pets page: 4 packs listed (orb, dragon, neon-kitty, penguin) — patched
- [ ] G1.5 Pets pickable: setActivePet + notifyPetSwitch IPC (preload + main) — currently missing
- [ ] G1.6 Overlay glitch fix: pet window must only capture clicks on actual pet hitbox (B=0.62), not full 420x700 bounds
- [x] G1.7 Pet hide/show buttons in toolbar + set-pet-visibility (exists)

**Acceptance criteria:**
- Pick a provider from dropdown -> baseURL/model autofill -> Save -> Test -> Activate all work
- Click a pet panel -> pet switches (not just visual)
- Moving cursor over empty pet-window area does NOT block clicks underneath (click-through works)
- Hide button makes pet disappear instantly; Show restores it

**Status:** PARTIAL — UI patched; IPC handlers + overlay hitbox fix remain.

---

## G2 — Avatar System (P1)

**Objective:** All 4 pets validate, render, and switch correctly in the overlay.

**Sub-goals:**
- [x] G2.1 default-nyc-orb (canvas, 927B SVG) — validates
- [x] G2.2 dragon-nyc (1.4MB GLB from avatar-os/dragonos) — validates, three@0.185.1 added
- [x] G2.3 neon-kitty-nyc (3.9MB GLB from Roblox-Assets) — validates
- [x] G2.4 penguin-nyc (19MB GLB from Desktop/assets) — validates
- [x] G2.5 .smartpet exports (dragon 2.7MB, neon 4.4MB; penguin 26MB local)
- [ ] G2.6 Wire GLTFLoader into overlay index.html pet-container (Three.js renderer, not just CSS orb fallback)
- [ ] G2.7 Progressive loading (dragon/neon load fast; penguin 19MB lazy-loads only when selected)
- [ ] G2.8 Pet switch triggers anim-state + pet-appear events to bubble + chat windows

**Acceptance criteria:**
- Selecting dragon/neon/penguin shows the actual 3D model in the overlay (not the orb fallback)
- Models are lit with NYC palette (amber/civic-blue/steel), rotate/idle animate
- validatePetPack -> PASS for all 4 (0 warnings)
- Fallback to orb when Three.js fails (graceful degradation)

**Status:** PARTIAL — Assets + validation done; renderer integration remaining.

---

## G3 — Test & QA (P1)

**Objective:** Full suite green; install/start reproducible from scratch.

**Sub-goals:**
- [x] G3.1 pnpm test — 24/24 pass
- [x] G3.2 pnpm typecheck — pass
- [ ] G3.3 Add pet-switch integration test (select pack -> renderer shows model)
- [ ] G3.4 Add provider save/test/activate e2e test (mocked)
- [ ] G3.5 Add overlay click-through test (hitbox vs full window)
- [ ] G3.6 scripts/demo.sh — fresh-install -> start -> screenshot (clean machine)
- [ ] G3.7 Windows/macOS smoke via CI artifacts (scripts/verify-*.sh)

**Acceptance criteria:**
- pnpm test > 24 tests, all pass on Node 20/22/24 matrix
- Fresh clone -> pnpm install && pnpm --filter smart-pet-agent dev opens without manual fixes
- Screenshot proves pet visible + overlay click-through works

**Status:** PARTIAL — Core green; new integration tests pending.

---

## G4 — CI/CD (P1)

**Objective:** All GitHub Actions jobs green; artifacts produced.

**Sub-goals:**
- [x] G4.1 ci job green (unit tests + typecheck)
- [ ] G4.2 desktop-publish-ubuntu -> AppImage + deb (currently fails on build:linux)
- [ ] G4.3 desktop-publish-macos -> DMG (needs CSC_LINK signing secret)
- [ ] G4.4 desktop-publish-windows -> NSIS (needs WIN_CSC_LINK; also pnpm install issue)
- [ ] G4.5 mobile-preview -> debug APK (currently in progress; fix plugins/ cp guard in export-mobile-standalone.sh)
- [ ] G4.6 mobile-android-play-internal -> Play Console (needs EAS_TOKEN/GOOGLE_SERVICES)

**Acceptance criteria:**
- gh run list shows green for all jobs (or explicit skip when secrets absent)
- Linux AppImage/deb artifacts uploaded; verify scripts pass
- Mobile debug APK built + apksigner PASS

**Status:** RED — CI core green; publishes fail on ABI/signing/plugins.

---

## G5 — Publish & Monetization (P1/P2)

**Objective:** Public GitHub repo, truthful docs, pricing, monetization live.

**Sub-goals:**
- [x] G5.1 Hygiene files (LICENSE MIT, SECURITY, CODE_OF_CONDUCT, CHANGELOG, CONTRIBUTING, FUNDING, issue/PR templates)
- [x] G5.2 README public-ready (realstreetsmartnyc, v1.0.0, roadmap, banner)
- [x] G5.3 Banner/social preview (docs/banner.svg + banner.png 1280x640 NYC)
- [x] G5.4 PRICING.md + docs/Monetization.md (free MIT + sponsors + pet packs + sync + support)
- [x] G5.5 PUBLISH_READINESS_SUMMARY.md + REFINEMENT_PLAN_FROM_EXPERIENCE
- [x] G5.6 smart-apple-dev: public + CI green + PyPI release v1.0.0
- [ ] G5.7 smart-pet-agent: flip private -> public (after G0-G4 green)
- [ ] G5.8 Cut v1.0.0 tag + GitHub Release with installer artifacts
- [ ] G5.9 Set social preview image (upload banner.png via Settings)
- [ ] G5.10 GitHub Sponsors + Open Collective + Ko-fi links verified

**Acceptance criteria:**
- gh api repos/realstreetsmartnyc/smart-pet-agent -> visibility: public
- gh release list shows v1.0.0 with AppImage/deb attached
- No YOUR_ORG, no "private alpha", no baked credentials (grep scan clean)

**Status:** 90% hygiene done; flip + release blocked on G0-G4.

---

## G6 — Post-launch Growth (P2+)

**Objective:** First users, contributors, revenue.

**Sub-goals:**
- [ ] G6.1 Launch posts (HN Show HN, r/iOSProgramming, r/Python, Product Hunt)
- [ ] G6.2 Star History badge + Discord/Discussions
- [ ] G6.3 Cloud Build (managed Mac minis, 100 min free, $19/$49 tiers)
- [ ] G6.4 LLM Gateway (one key -> 21 providers, $0.001/1K tokens)
- [ ] G6.5 Premium pet packs store ($0.99-$4.99)
- [ ] G6.6 Success metrics: 1K stars, 5K downloads, 10 paying users

**Status:** NOT STARTED — after G5.

---

## Dependency Graph

```
G0 (runtime) --> G1 (UI) --> G2 (avatars) --> G3 (tests) --> G4 (CI) --> G5 (publish) --> G6 (growth)
                              |
                              +-- G2.6 renderer depends on G1.5 (pet switch IPC)
```

## Immediate Next Actions (ordered)

1. G0.2/G0.3 — Save Electron ABI-130 .node to /tmp, rebuild Node 137, fix dev spawn to node (partially done)
2. G1.2/G1.5 — Add providers:test, providers:activate, setActivePet, notifyPetSwitch IPC (preload + main)
3. G1.6 — Overlay hitbox click-through (only block clicks on B=0.62 pet body)
4. G2.6 — GLTFLoader in overlay renderer (load pets/<id>/assets/model.glb)
5. G4.5 — Fix export-mobile-standalone.sh plugins/ cp guard
6. G3.6 — scripts/demo.sh fresh-install smoke
7. G5.7 — Flip public + tag v1.0.0 once green

---

*This plan supersedes ad-hoc work. Every goal has checkboxes + acceptance criteria. Re-run the state audit each session to keep the plan current.*
