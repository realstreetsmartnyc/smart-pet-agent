# Smart Pet Agent Publish-Ready Execution Plan

Date: 2026-08-30
Last audited: 2026-08-31
Status: Working master plan — not publish-ready
Scope: Define how Smart Pet Agent continues from the current prototype state to publish-ready desktop release quality.

## Current Audit Position

Sprint 1 and the 2026-08-31 UI realignment delivered the event contract, SQLite-backed permissions, platform adapter boundaries, Electron event routing, shared NYC tokens, branded dashboard/overlay/bubble surfaces, and a passing development smoke gate. The project remains internal `v0.1.x` hardening because action policy is not granular enough for real computer control, platform behavior and packaging are unverified, and live Electron QA has not been completed.

The authoritative evidence and findings are in [`SMART_PET_AGENT_GOALS_AUDIT_2026-08-31.md`](SMART_PET_AGENT_GOALS_AUDIT_2026-08-31.md) and [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md). A green smoke script is necessary but not sufficient for any publish milestone.

## Planning Assumptions

- Current state is an early prototype with partial core runtime, Electron shell, CLI pieces, reverse-engineering notes, and branding direction.
- The target product is a standalone `Smart Pet Agent` app, not an OpenClaw plugin.
- The first publish-ready target should prioritize desktop, with Windows treated as a first-class release target.
- Publish-ready means more than "builds locally." It means branded, tested, permission-safe, installable, understandable, and supportable.

## Publish-Ready Definition

Smart Pet Agent is publish-ready when all of the following are true:

- the app has a coherent Street Smart NYC product identity across overlay, dashboard, installer, and docs,
- the local runtime is stable across supported desktop environments,
- permissions for computer use and peripherals are explicit, durable, and revocable,
- the pet feels meaningfully alive through thought-driven states,
- at least one pet pack ships with polished baseline expressions and actions,
- core assistant flows work end to end,
- failures are visible and recoverable,
- packaging and installation work cleanly on the initial target OS,
- release notes, onboarding, and trust documentation exist,
- there is a clear supportable scope for v1.

## Core Goals From Here To Launch

### Product goals

- turn the prototype into a real standalone app
- make the app feel distinctively Smart Pet Agent, not derivative
- preserve the NYC-branded aesthetic and companion personality
- choose a disciplined v1 scope that is impressive but supportable

### Engineering goals

- stabilize the runtime architecture
- replace prototype-only bridges and stubs with durable contracts
- support cross-platform architecture even if Windows ships first
- make permissions, events, errors, and actions traceable

### UX goals

- make overlay, bubble, and dashboard feel polished and unified
- ensure the pet remains ambient rather than distracting
- make device access and agent actions understandable at a glance
- make onboarding simple enough for non-expert users

### Business and launch goals

- publish a version that can be safely distributed
- define what is free, what is optional, and what is future roadmap
- avoid shipping a trust-risky or support-heavy feature set too early

## Recommended Release Strategy

### Versioning approach

- `v0.1.x`: internal architecture and UI hardening
- `v0.2.x`: internal dogfood desktop app with branded shell and permission model
- `v0.3.x`: closed alpha with core overlay, chat, permissions, and one polished pet
- `v0.4.x`: beta with computer use, voice, pet customization, and installer polish
- `v1.0.0`: public publish-ready release

### Recommended v1 scope

Ship in `v1.0.0`:

- desktop overlay pet
- thought bubble
- branded chat/dashboard
- stable local runtime
- text chat
- basic voice input/output
- permission-gated screen, app, file, mouse, and keyboard actions
- one polished default pet
- support for loading custom pet packs
- optional delegation adapters for a small supported set
- logs, settings, onboarding, and trust surfaces

Defer until after `v1.0.0` unless they land cleanly (mobile planned post-v1, not in Sprint 2):

- full 3D companion rooms
- marketplace commerce
- advanced monetization
- multi-user/team workflows
- broad plugin ecosystem
- deep mobile parity (Android/iOS — **planned post-v1**, see Mobile Addendum below)

## Workstreams

The path to publish-ready should run across eight workstreams:

1. Runtime and architecture
2. UI and brand implementation
3. Pet embodiment system
4. Computer use and permissions
5. Voice and multimodal interaction
6. Packaging, installation, and release engineering
7. Documentation, onboarding, and support readiness
8. Launch readiness and distribution

## Phase Plan

### Phase 1: Runtime Foundation — partial / release-blocked

Objective:

- turn the prototype core into a stable local application runtime

Deliverables:

- versioned event protocol between core and UI
- persistent session and state store
- durable permission model
- task lifecycle model
- structured logs and error events
- provider configuration model
- normalized delegation adapter interface

Key tasks:

- define event schema for chat, task, pet, permission, and system events
- separate runtime services from UI shells
- persist permissions, preferences, and recent task state
- harden the child-process bridge or replace it with a better IPC contract
- define health checks and recovery behavior when runtime fails

Exit criteria:

- app can start, reconnect, and recover predictably
- UI receives structured events instead of placeholder assumptions
- settings and permissions survive restart
- errors appear in UI and logs clearly

### Phase 2: NYC-Branded UI Shell — partial / visually promising, behavior still unverified

Objective:

- replace the generic prototype visuals with the Smart Pet Agent product interface

Deliverables:

- branded dashboard layout
- branded overlay and bubble styling
- shared design tokens
- typography, palette, iconography, and motion system
- screens for chat, tasks, permissions, devices, pets, memory, and settings

Key tasks:

- replace generic blue-and-white chat shell
- rename all visible product labels to `Smart Pet Agent`
- implement the Street Smart NYC palette and surface system
- add utility states for permission requests, tool use, and task progress
- design compact status affordances for overlay and bubble

Exit criteria:

- every visible surface feels like one product
- the UI no longer looks like a reused template
- the app is legible over mixed desktop backgrounds
- core screens exist and are navigable

### Phase 3: Pet Engine And Embodiment

Objective:

- make the pet feel alive through reasoning-linked behavior

Deliverables:

- semantic pet intent model
- pet state-to-animation mapping
- first polished default pet
- fallback renderer improvements
- pack validator and preview flow

Key tasks:

- separate raw animation names from agent intent states
- define minimum required expression set for shipped pets
- improve eye, mouth, posture, and mood signaling
- support idle, listening, thinking, acting, warning, waiting, sleep, and celebrate states
- implement pack preview and validation for pet assets

Exit criteria:

- a user can tell what the pet is doing without reading logs
- the shipped pet feels intentional, not placeholder
- custom pet packs can be loaded and validated safely

### Phase 4: Computer Use And Permission Trust Model

Objective:

- make Smart Pet Agent useful as an OS agent without violating trust

Deliverables:

- platform adapter model
- action permission prompts
- device access settings
- audit trail for actions taken
- visible active-device indicators

Key tasks:

- refactor Linux-specific peripheral logic into OS-specific adapters
- define permission scopes for files, apps, browser, screen, mouse, keyboard, camera, mic, and network
- implement request, grant, deny, revoke, and remember-choice flows
- add confirmation rules for consequential actions
- create user-facing logs for what happened and why

Exit criteria:

- computer use only happens under explicit policy
- the user can inspect and revoke access easily
- platform-specific implementations are isolated and testable

### Phase 5: Voice And Multimodal Interaction

Objective:

- add natural interaction without destabilizing the core app

Deliverables:

- voice input
- voice output
- wake/confirm/cancel flow
- listening and speaking pet states
- optional screen/context perception hooks

Key tasks:

- choose v1 voice stack
- define push-to-talk or wake interaction model
- surface recording state clearly
- ensure transcripts and failures are visible
- connect audio state to pet embodiment and bubble feedback

Exit criteria:

- user can reliably speak to Smart
- the app clearly signals when it is listening or speaking
- voice does not create hidden or confusing device access

### Phase 6: Default User Journey And Onboarding

Objective:

- make the app understandable for a first-time installer

Deliverables:

- onboarding flow
- first-run setup for models and permissions
- sample tasks
- default pet introduction
- trust and privacy explanation

Key tasks:

- create welcome flow
- explain what Smart can do and what requires permission
- make provider setup simple
- provide example starter commands
- guide the user through enabling their first safe capability

Exit criteria:

- a new user can install, onboard, and complete a first task without outside help
- the app explains itself clearly before asking for sensitive access

### Phase 7: Packaging And Release Engineering

Objective:

- make the app installable, signable, versioned, and shippable

Deliverables:

- Windows installer pipeline
- build reproducibility
- release packaging checklist
- versioning and changelog process
- asset bundling and update strategy

Key tasks:

- choose Electron vs Tauri release path for v1
- create release builds and installer scripts
- verify paths, icons, names, and bundled assets
- test clean install, update, uninstall, and reset flows
- define crash/report logging boundaries

Exit criteria:

- installer works on clean target machines
- app upgrades and uninstalls cleanly
- release artifacts are reproducible and versioned

### Phase 8: QA, Hardening, And Publish Gate

Objective:

- prove the app is publishable, not just promising

Deliverables:

- test plan
- QA matrix
- bug triage checklist
- performance pass
- publish gate report

Key tasks:

- run end-to-end task flows
- validate overlay behavior while gaming/video playback is active
- test permission edge cases and denied flows
- test runtime recovery, failed provider setup, and missing devices
- test custom pet loading and invalid asset handling
- test installer behavior on clean machines

Exit criteria:

- no release-blocking crashes in core flows
- permissions and device states are trustworthy
- UI is performant enough for ambient daily use
- the shipped scope is supportable

## Milestone Sequence

### Milestone A: Architecture green

- runtime protocol defined
- permissions persisted
- UI no longer depends on fake placeholder streaming

### Milestone B: Brand green

- dashboard, overlay, and bubble visually match Smart Pet Agent identity
- all naming and product language unified

### Milestone C: Embodiment green

- one default pet is polished enough to represent the product publicly

### Milestone D: Trust green

- permission, device, and action policies are implemented and testable

### Milestone E: Install green

- clean installer and upgrade flows work on target Windows systems

### Milestone F: Publish green

- docs, onboarding, QA report, release notes, and final artifacts complete

## Dependencies And Order Of Operations

Do these first:

1. Runtime protocol and permission model
2. UI shell redesign and product naming cleanup
3. Platform adapter structure for computer use

Do these next:

1. Pet embodiment/state model
2. Voice flow
3. Onboarding and settings UX

Do these after the foundations are stable:

1. Packaging and installer
2. QA matrix and hardening
3. alpha/beta distribution

## Risks To Control Early

- shipping generic UI and losing product identity
- shipping computer use before trust and permission UX are ready
- tying the runtime too tightly to one agent provider or external tool
- over-scoping v1 with marketplace or 3D ambitions too early
- supporting too many OS-specific capabilities before adapter boundaries are clean
- making the pet expressive but not operationally clear

## Publish Checklist

### Product

- product name consistent as `Smart Pet Agent`
- one clear v1 promise
- one polished default pet
- coherent Street Smart NYC branded experience

### Engineering

- stable runtime
- persisted settings and permissions
- structured logs
- recoverable failures
- tested installers

### UX

- onboarding complete
- settings understandable
- permission prompts clear
- overlay, bubble, and dashboard polished

### Safety and trust

- permission scopes documented
- sensitive actions gated
- visible indicators for listening, recording, screen access, and active control
- audit trail available

### Release ops

- versioned artifacts
- changelog
- release notes
- known issues list
- support and feedback path

## Sprint 1 Complete → Sprint 2 Ready (v0.1.x → v0.2.x Gate)

**Sprint 1 is now complete for development** — verified `pnpm typecheck EXIT:0`, `pnpm test 11 pass`, `bash scripts/smoke.sh SMOKE GREEN` (`0× :root` / `{ok:true}` / headless `perceive`/`generateVoice`/`spawn`), `validatePetPack {ok:true}` 11 intents, `conf` in `app.asar`, `linux-unpacked` 178 MB. See [`SMART_PET_AGENT_GOALS_AUDIT_2026-08-31.md §5/§7`](SMART_PET_AGENT_GOALS_AUDIT_2026-08-31.md) and [`SPRINT_2_PLAN_2026-08-31.md`](SPRINT_2_PLAN_2026-08-31.md).

## Recommended Immediate Next Sprint: Sprint 2 — Trust + Live Acceptance (to Sprint 3 Ready)

**Goal:** Prove trust + live behavior so Sprint 3 can be pure polish. Full breakdown, exit criteria, and `xvfb`/`Windows` verification table are in [`docs/SPRINT_2_PLAN_2026-08-31.md`](SPRINT_2_PLAN_2026-08-31.md) — ready to begin on your go. No code changes until you say `go`.

**Sprint 2 exit (all observed, not inferred) before Sprint 3:**
1. Live Electron clean-profile: `agent.ready` → streaming `chat.chunk` + `provider` chip + `pet.intent` halo + `chat.done`/`task.completed`, permission toggle → restart persist, `chat.error` + `runtime.log`, overlay drag `B=0.62` + `setIgnoreMouse` click-through over video.
2. Windows device gates: `captureScreen`/`captureCamera`/`recordAudio` either succeed with non-empty file or explicit `* failed` throw (no fake path / `sleep`).
3. Packaging: `build/linux-unpacked` headless without `conf` error + Windows `nsis` on clean Windows.
4. CI: `pnpm typecheck` + `pnpm test` + `pnpm validate:pet` + `bash scripts/smoke.sh` (now `[5/5]`) all green, no manual Node commands.
5. Pet/trust surfaces: `checkAssets` for `video` packs, `Tasks`/`Devices`/`Permissions`/`Pets`/`Settings` show real SQLite data.

**Sprint 3 (queued, starts only on Sprint 2 green):** Pet video pack + voice/STT + installer polish + onboarding tour.

## How We Continue From Here

Use this plan as the master sequence:

1. finish foundation work before chasing launch polish
2. finish brand/UI work before judging the product feel
3. finish trust and permissions before expanding computer use
4. finish one polished pet before broad pet-platform ambitions
5. finish installer and QA gates before calling anything publish-ready

### Release decision rule

Do not advance to `v0.2.x` dogfood or `v0.3.x` closed alpha until the core typecheck, protocol tests, action policy, and live Electron acceptance pass are green. Do not call any build publish-ready until the Windows NSIS install/upgrade test, release checklist, onboarding, known-issues list, and support path are complete.

The right path is not "build everything at once." It is "stabilize the runtime, lock the product identity, prove trust, polish one excellent desktop experience, then publish."

## Mobile Addendum — Android & iOS (Post-v1, Sprint 4+)

**Intent:** Once `v1.0.0` desktop is install-green on Windows, extend the **same core runtime** (`packages/core`) to Android/iOS without forking logic. Mobile is not a separate app — it is the same `AgentLoop` + `MemoryStore` + `RuntimeEvent` + permission model with platform adapters.

**Why deferred:** Mobile needs touch/overlay constraints, store review, push notifications, and background limits that are support-heavy. Desktop must be stable first. **Do not start mobile until Sprint 2 live + Sprint 3 pet/voice/installer polish are green and `v1.0.0` desktop is publish-green.**

**Planned architecture (no code yet):**
- `packages/core` stays platform-agnostic (already per-action `validateComputerAction`, `spawn` adapters). Add `mobile` adapter stubs (no `mouse`/`keyboard`, add `notifications`, `haptics`, `biometrics`).
- `apps/mobile` (Sprint 4): React Native or Capacitor wrapper + Tauri-mobile or Expo. Reuses `RuntimeEvent` NDJSON bridge; overlay on mobile is **notification + widget**, not transparent `BrowserWindow` (mobile OS forbids ambient overlay). Chat/bubble become main UI.
- Permissions: mobile maps to OS prompts (`camera`→`AVCapture`, `microphone`→`AVAudioSession` / `RECORD_AUDIO`, `files`→`scoped storage` / `File Provider`, `notifications`→`UNUserNotification` / `POST_NOTIFICATIONS`).
- Pet: same `manifest.json`/`pet.config.json` + `validatePetPack` + `checkAssets`; mobile renderer uses `canvas`/`lottie` (no `.webm` autoplay issues). `pet.intent` halo → `Animated.View`.
- Voice: mobile uses native TTS/STT first (iOS `AVSpeech`, Android `TextToSpeech`/`SpeechRecognizer`), then Piper/Whisper parity later.

**Sprint sequencing (after Sprint 2/3):**
- **Sprint 4 — Mobile Foundation:** `apps/mobile` scaffold, core bridge (`AgentLoop` via `better-sqlite3` → `op-sqlite` / `expo-sqlite`), `RuntimeEvent` `chat.chunk`/`pet.intent`/`permission.updated` over same NDJSON, `pnpm mobile:smoke` (validator + headless + typecheck), TestFlight/Play Internal Track no-store-review yet.
- **Sprint 5 — Mobile Trust + Store:** OS permission prompts, audit parity, push (optional), store icons/screenshots, `v1.1.0-mobile-beta` closed track, `RELEASE_CHECKLIST.md` mobile gates.

**Sprint 2/3 non-goal:** No Android/iOS work in Sprint 2/3. Keep `v0.1.x`→`v0.2.x` focused on live Electron + Windows device + packaging. Mobile is tracked but gated.
