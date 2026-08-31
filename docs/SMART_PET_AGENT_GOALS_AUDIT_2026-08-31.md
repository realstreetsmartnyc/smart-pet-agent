# Smart Pet Agent — Goals Audit & UI Realignment (2026-08-31)

> Audit of every goal, NYC aesthetic compliance, drag audit, and plan realignment after Sprint 1.

This replaces scattered goal fragments across README/brief/competitive/execution plan with one canonical inventory, then shows what is now NYC-compliant and what moved to next sprint.

---

## 1. Product Naming — Single Source (Brand Brief §Product Naming)

**Canonical:** `Smart Pet Agent` everywhere visible. `Smart` only as pet nickname inside conversation.
- App title, tray, onboarding, settings, docs, installer, splash: `Smart Pet Agent`
- Chat header, brand rail, bubble title: `Smart Pet Agent`
- Agent self-reference in dialogue: `Smart`

**Verified 2026-08-31:** `apps/electron/dist/chat.html` title + brand rail already correct. Fixed `apps/electron/dist/index.html` title (was `Smart-Pet-Agent` hyphen). Fixed overlay `title` attribute. Remaining: `apps/desktop/index.html` Tauri shell still generic — now replaced with NYC tokens (see §4).

---

## 2. Complete Goals Inventory (12 groups, 52 goals)

### A. Identity & Brand (Competitive §Complete Product Goals + Brief §Full Product Goals)
1. Establish `Smart Pet Agent` as standalone app, not plugin (over OpenClaw/PetClaw derivative)
2. Align naming, copy, motion, visual design with Street Smart NYC system
3. Make pet unique to Street Smart NYC ecosystem (not PetClaw/OpenClaw skin)
4. Build recognizable identity across overlay, dashboard, bubble, CLI, TUI, docs, installer

### B. NYC Aesthetic System (Brief §NYC Visual Direction + Colors + Surfaces)
5. Palette: ink-950 #0b0d10, asphalt-900 #14181d, steel-700 #41505f, tile-100 #f2efe8, taxi-500 #f4b400, signal-500 #ff8a1f, civic-500 #2f80ed, alert-500 #d64545, success-500 #2da56a
6. Materials: smoked glass, brushed steel, dim billboard glow, map-line dividers
7. Typography: transit grotesk / editorial sans + compact mono for telemetry/logs/permissions
8. Motion: short slide-ins, route-trace, pulse on thought, snap-to-state on approve/fail, soft breathe when calm (no floaty spring/particles/random)
9. Copy tone: direct, human, competent, lightly companionable (`Ready on your desktop`, `Need your permission to use the camera`) — no baby talk / corporate filler
10. Overlay surface: alive in corner, readable over games/video, click-through when not hovered, 1-glance emotion
11. Bubble surface: compact ticker, smoked-glass card, route-line/signal stripe, chips for Listening/Thinking/Using Browser/Needs Permission/Done
12. Chat surface: command center + companion console (left rail 240px, main conversation, right utility drawer for tools/permissions/tasks)
13. Settings surface: model providers, devices/peripherals, computer use, privacy/memory, pet appearance/voice, delegation targets

### C. User Experience (Competitive §User experience goals + Execution UX goals)
14. Always-on ambient presence without distraction (games/video/work coexist via click-through B=0.62 + patrol disabled, thought-driven)
15. Interaction by typing, clicking, voice, future multimodal (same personality/language/state across GUI/CLI/TUI)
16. Warm, capable, trustworthy companion feel
17. Continuity across overlay, dashboard, CLI, TUI (one runtime)
18. Ensure pet remains ambient not distracting; device access understandable at a glance; onboarding simple for non-experts

### D. Agent Capability (Competitive §Agent capability goals + Execution Product goals)
19. General assistant work + research + automation + computer use
20. Delegated specialist work across Hermes/Codex/Qwen/OpenCode/Cline/Gemini/Aider without losing one identity (federation, not dependence)
21. Long-running tasks, proactive HEARTBEAT checks, background work
22. Pet explains what/why it is doing (reasoning + provenance in bubble/chat)
23. Multi-provider AI without vendor lock (Ollama, LM Studio, LiteLLM, OpenAI, Anthropic, Google, custom — per-task select + fallback chain)
24. One clear v1 promise (see Execution §Recommended v1 scope)

### E. Embodiment (Competitive §Embodiment goals + Brief §Pet Expression System)
25. Motion/expression/gaze/talk/sleep/celebrate tied to reasoning (not random timers)
26. Richer facial/body expression over time; react to success/failure/wait/listen/approval/environment
27. Support video pets first, richer rigged (Spine/Lottie/Three) later
28. 10 differentiated states minimum: idle, listening, thinking, planning, acting, waiting, asking permission, celebrating, warning, sleeping, resuming (halo/gaze/blink speed/mouth/ear-wing-tail color/travel lean)
29. Fallback renderer that already feels Street Smart NYC, not placeholder orb

### F. Platform (Competitive §Platform goals)
30. Ship reliable Windows desktop first (benchmark starts from Windows PetClaw installer)
31. Keep architecture cross-platform (macOS/Linux expansion via platform adapters, not Linux-only shells)
32. One core runtime for GUI/CLI/TUI
33. Local-first with optional networked providers

### G. Trust & Safety (Competitive §Trust and safety goals + Execution Safety)
34. Permissions granular, durable, revocable, inspectable (ask / allow-while-active / always-allow / always-deny + scopes)
35. Show active device/computer access clearly (listening/recording/screen/control halos + telemetry)
36. Logs/audit traces for actions taken on behalf of user
37. Prevent hidden/accidental destructive behavior; sensitive actions gated + confirmation rules

### H. Ecosystem (Competitive §Ecosystem goals)
38. Stable pet manifest (`manifest.json` + `pet.config.json` + assets + rig) with validator/packer/preview
39. Extension/plugin hooks without app dependence
40. Optional bridges into OpenClaw/Hermes/Codex/etc.
41. Marketplace/creator path prepared but deferred post-v1

### I. Engineering Publish-Ready Gates (Execution §Publish-Ready Definition: 10 criteria)
42. Coherent Street Smart NYC identity across overlay/dashboard/installer/docs
43. Stable local runtime across supported desktop envs (health checks, recovery, structured logs/error events)
44. Explicit/durable/revocable permissions (PermissionService + SQLite)
45. Thought-driven pet states (semantic intent `pet.intent` → pack mapping)
46. ≥1 polished default pet pack with baseline expressions/actions
47. Core assistant flows end-to-end (chat → reason → act → stream → done)
48. Failures visible & recoverable (chat.error, agent.status error, telemetry)
49. Clean packaging/installation on initial OS (Windows NSIS)
50. Release notes/onboarding/trust docs exist
51. Clear supportable v1 scope (defer 3D rooms/marketplace commerce/multi-user/broad plugins/mobile parity)

### J. Screen-Specific Goals (Brief §Screen Goals: 5 screens)
52. Ambient overlay / Fast chat / Trust dashboard / Pet customization / Ongoing work (background tasks visible, scheduled/proactive inspectable)

### K. Business / Launch (Execution §Business goals)
53. Publish safely distributable version; define free/optional/roadmap; avoid trust-risky or support-heavy bloat

---

## 3. NYC UI Realignment — What Changed 2026-08-31

### chat.html (dashboard) — Already compliant (Sprint 1)
- Tokens: ink/asphalt/steel/tile/taxi/signal/civic/alert/success + mono/sans + glass/border correctly implemented
- Layout: 240px rail + 1fr chat + 280px utility drawer matches brief §Chat window
- Brand: `Smart Pet Agent` title, `Street Smart NYC` kicker, taxi→signal send button, civic/signal/success chips
- No change needed except draggable hardening (see §5).

### index.html (overlay pet) — FIXED 2026-08-31
- Before: generic blue glass ball `radial-gradient(… #6496ff)`, white/black eyes, #e9ecef chat, system fonts
- After: NYC tokens on :root, pet-mood uses asphalt/steel/tile radial with inset steel highlight + taxi/signal halo (1px border + outer glow per mood), eyes tile-100 on ink-950, mouth tile-100, thinking pill upgraded to smoked-glass asphalt-900 + signal dot + taxi/signal shimmer + mono uppercase, status halo element for listening/thinking/acting, `pending` self-drop prevented by `draggable` guard (see §5), B=0.62 hitbox preserved
- Function preserved: breathe, blink, drag via Electron IPC, rapid triple-click, waveform show/hide, animState mapping to `pet.intent` now also listens to `runtime-event: pet.intent`

### pet-bubble.html — FIXED 2026-08-31
- Before: `rgba(14,14,16,0.95)` generic dark, no stripe, sans only
- After: NYC tokens, smoked-glass `linear-gradient(asphalt-900→ink-950)` + blur 16, top 3px taxi→signal stripe, tile-100 text, mono uppercase chips: running=civic-500, listening=signal-500, done=success-500, tail asphalt clip, listens to both `ai-*` and `runtime-event: chat.chunk/pet.intent`

### apps/desktop/index.html (Tauri) — REPLACED 2026-08-31
- Before: identical generic blue orb + light chat box + system fonts (diverged from Electron)
- After: rebuilt from Electron overlay NYC template + Tauri `__TAURI__` invoke bridge (async `agent_speak` etc.), shared tokens, same halo/mouth/eye system, chat panel now uses asphalt/tile/civic styling with Smart Pet Agent header

### Shared Design Tokens Created
- Created `apps/electron/dist/tokens.css` (canonical) + inlined :root into overlay/bubble/Tauri for standalone window loads. Single source for future `packages/ui-tokens` extraction.

---

## 4. Drag Audit — `app-shell-tab:52` Self-Drop

**Log:** `Draggable item app-shell-tab:52 was dropped over droppable area app-shell-tab:52`

**Root cause:** Test harness treats `div.nav-item[data-page]` as draggable `app-shell-tab` items. In Sprint 1 dashboard they had no explicit `draggable` attribute, so HTML5 default allowed the harness to synthesize a drag where drag-item and drop-target resolved to same element ID 52 (same nav row). No actual user-visible reordering intended — nav is fixed order Chat/Tasks/Devices/Permissions/Pets/Settings.

**Fix applied 2026-08-31:**
- Added `draggable="false"` to every `.nav-item` in `apps/electron/dist/chat.html`
- Added `role="button" tabindex="0" aria-current` for a11y, `dragstart: preventDefault()` handler
- No DnD library imported — native self-drop now impossible; if future tab reordering is desired, it must be added behind `data-reorderable` flag with `if (dragId===dropId) return` guard.

**Verification:** Re-ran `grep -r draggable` — only TypeScript lib definitions and prevention handlers remain. No `app-shell-tab` droppable remains self-targetable. Pet-window drag (Electron `startDrag/dragMove/stopDrag` at 62% hitbox) unaffected — isolated to transparent overlay BrowserWindow.

---

## 5. Plan Realignment — Post-Sprint 1

### What Sprint 1 actually delivered (verified in code)
- `packages/core/src/runtime-events.ts` versioned `RuntimeEvent` (agent.ready/status, chat.chunk/done/error, permission.updated, pet.intent, voice.state)
- `packages/core/src/permission-service.ts` durable SQLite-backed permissions
- `packages/core/src/memory.ts` permission table migration
- `packages/core/src/peripheral-manager.ts` → platform-adapter skeleton (Windows/Linux/macOS branches, no longer Linux-only xdotool)
- `apps/electron/src/main.js` structured stdout NDJSON → `routeRuntimeEvent` → broadcast to all windows + permission cache + send-buffer flush
- `apps/electron/src/preload.js` `getPermissions/setPermission` + `onRuntimeEvent`
- `apps/electron/dist/chat.html` first NYC-branded dashboard (rail + header + messages + toolbar + input + utility permission panel)

### What was NOT yet NYC-branded (gap closed now)
- Overlay pet and bubble were still generic — now NYC-branded (see §3). Milestone B (Brand green) no longer blocked by overlay/bubble.

### Updated Execution Plan status
- Phase 1 (Runtime Foundation): **~85%** — event contract + permission persistence + adapter skeleton done; remaining: flush harden child-process bridge with health/retry + provider config model + task lifecycle + audit log surface
- Phase 2 (NYC-Branded UI Shell): **~55% → ~80% after this patch** — dashboard was done, now overlay/bubble/Tauri also done; remaining: shared `tokens.css` extraction, screens for Devices/Pets/Memory/Settings, compact status affordances for overlay grain, legibility pass over mixed backgrounds
- Phase 3-8: unchanged scope, but Phase 3 now unblocked early (semantic `pet.intent` already emitted, pack validator can start)

### Immediate next sprint (revised Sprint 1.1)
1. Extract shared tokens to `packages/ui-tokens/tokens.css` and import in all windows (remove inline duplication)
2. Harden `apps/electron/src/main.js` bridge: health check interval + retry on `agent.status: error` + structured logs to file
3. Implement Devices/Pets/Settings screens in `chat.html` (reuse rail nav; add route handler — currently click only toggles active without page switch)
4. Ship one default video pet pack that demonstrably maps all 10 expression states (currently CSS fallback orb only)
5. Live Electron smoke test with permission toggles + chat streaming + overlay drag over media playback (validates `permission.updated` persistence + `pet.intent` halo)

---

## 6. How to Use This Audit

- **For design review:** Brief §Color System + §Surface Design vs. §3 changes is the checklist. Every window should now pass "could this be mistaken for generic PetClaw?" — answer must be no.
- **For planning:** Execution Plan Phase 1-2 exit criteria remain authoritative; this doc only updates % complete and next 5 items.
- **For brand QA:** Grep for `Smart-Pet` hyphen or `petclaw` lowercase outside `REVERSE_ENGINEERING` — zero hits expected after §1 fixes.

*Audit date: 2026-08-31 · Author: internal audit (code + docs read to end-of-brand) · Sources: `SMART_PET_AGENT_UI_BRAND_BRIEF`, `SMART_PET_AGENT_COMPETITIVE_REBUILD_PLAN`, `PUBLISH_READY_EXECUTION_PLAN`, `REVERSE_ENGINEERING_PETCLAW`, `CUSTOM_PET_SPEC`, all `apps/*` HTML/JS/RS*
