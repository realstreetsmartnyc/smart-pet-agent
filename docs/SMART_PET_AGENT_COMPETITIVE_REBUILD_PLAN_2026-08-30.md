# Smart-Pet-Agent Competitive Rebuild Plan

Date: 2026-08-30
Scope: Reframe `smart-pet-agent` as a standalone ambient OS agent app, not an OpenClaw plugin.

## Executive Direction

Smart-Pet-Agent should be built as its own local-first agent runtime with:

- an always-on desktop pet overlay,
- a full chat/control surface,
- CLI/TUI/GUI entrypoints,
- permission-gated computer use and peripherals,
- persistent memory and evolving personality,
- optional delegation to other agents instead of hard dependency on them.

The PetClaw reverse engineering work is useful as a UI template and interaction benchmark, but not as the product architecture. The durable product shape is:

`standalone agent app first -> interoperates with OpenClaw/Hermes/Codex/Qwen/OpenCode when useful`

## What We Learned From The Current Repo

The existing repo already points in the right direction:

- `apps/electron/src/main.js` already mirrors the PetClaw three-window model: overlay pet, thought bubble, and chat window.
- `packages/core/src/agent-loop.ts` already expresses the right top-level loop: perceive, remember, reason, act, learn.
- `packages/core/src/delegation-manager.ts` already treats other agents as optional execution targets.
- `docs/REVERSE_ENGINEERING_PETCLAW_0.1.3.md` already distinguishes template UX from the underlying OpenClaw-dependent runtime.
- `docs/CUSTOM_PET_SPEC.md` already sketches a pet packaging model that can become your own platform contract.

That means the right next move is not "port PetClaw." It is "finish the local runtime, permissions, and surface orchestration around the architecture already started here."

## Primary-Source Feature Matrix

### PetClaw

Useful features to borrow:

- ambient desktop presence instead of browser-tab presence,
- transparent overlay + bubble + full dashboard split,
- chat and voice entrypoints,
- click-through behavior so the pet can coexist with games and video,
- custom pet packaging and skill installation story.

Do not inherit:

- hard dependence on an upstream gateway model,
- opaque Bytenode-packed application logic,
- product identity tied to a pet skin over someone else's runtime.

Primary sources:

- PetClaw quick start says it is "an AI pet assistant that lives right on your desktop" and stays available on the desktop rather than hidden in a web page.
  Source: https://petclaw.ai/tutorial?slug=petclaw-quick-start-guide
- PetClaw terms describe local files, web information, and interaction with other applications as core functions.
  Source: https://petclaw.ai/terms

### OpenClaw

Useful features to borrow:

- local-first architecture,
- gateway/node separation,
- chat-channel interoperability,
- companion apps and Windows node mode,
- "your memories, your skills, your models, your machines, your data" ownership framing.

Do not inherit:

- requirement that Smart-Pet-Agent be a dependent companion under OpenClaw's gateway,
- messaging-first product identity,
- node permission model only through a parent gateway.

Primary sources:

- OpenClaw positions itself as open source, on-machine, and action-oriented.
  Source: https://openclaw.ai/
- Official docs describe Windows Hub with setup, tray status, chat, node mode, and local MCP mode.
  Source: https://docs.openclaw.ai/install
- Official docs describe node mode and declared Windows-native capabilities gated by policy.
  Source: https://docs.openclaw.ai/platforms/windows
- Official docs define nodes as companion devices exposing command surfaces like `camera.*`, `device.*`, `notifications.*`, and `system.*`.
  Source: https://docs.openclaw.ai/nodes

### Codex

Useful features to borrow:

- multi-surface continuity across app, editor, and terminal,
- task isolation with parallel work,
- strong code/task execution identity,
- memory and computer-use as first-class capabilities,
- explicit approval and plugin concepts for consequential actions.

Do not inherit:

- code-only framing,
- dependence on coding as the center of the product,
- cloud-task mental model as the only runtime model.

Primary sources:

- OpenAI describes Codex as built for end-to-end engineering work and designed for multi-agent workflows across worktrees and environments.
  Source: https://openai.com/codex/
- OpenAI's May 16, 2025 "Introducing Codex" post describes isolated tasks that can read/edit files and run commands.
  Source: https://openai.com/index/introducing-codex/
- OpenAI's April 16, 2026 "Codex for (almost) everything" post states the macOS and Windows app adds computer use, in-app browsing, image generation, memory, and plugins.
  Source: https://openai.com/index/codex-for-almost-everything/
- OpenAI developer docs describe Codex local memories and computer use.
  Sources:
  https://developers.openai.com/codex/memories
  https://developers.openai.com/codex/computer-use
  https://developers.openai.com/codex/use-cases/use-your-computer-with-codex

### Augment Code

Useful features to borrow:

- explicit review gates,
- reusable expert templates with environment and memory,
- loop-based orchestration rather than one-shot prompting,
- testing and code review as separate workers,
- shared memory that improves future runs.

Do not inherit:

- pure enterprise coding positioning,
- ticket-to-PR framing as the dominant interaction loop,
- team-shared memory as the default for a personal desktop companion.

Primary sources:

- Augment describes ticket-to-PR, vulnerability remediation, code review fleets, tester agents, reusable experts with their own environment/capabilities/memory, human review gates, and shared memory.
  Source: https://www.augmentcode.com/

### Cline

Useful features to borrow:

- editor + terminal + embeddable runtime story,
- explicit approvals,
- MCP integration,
- rollback/checkpoint thinking,
- agent runtime that can be embedded into other products.

Do not inherit:

- developer-only product framing,
- assumption that the terminal is the emotional center of the experience.

Primary sources:

- Cline's official site presents one open source runtime for editor, terminal, or embedding.
  Source: https://cline.bot/
- Cline docs describe file editing, terminal commands, browser use, and explicit approval for every action.
  Source: https://docs.cline.bot/cline-overview
- Cline IDE pages emphasize visual diffs, MCP tools, hooks, and rollback.
  Source: https://cline.bot/ide

### Qwen Code

Useful features to borrow:

- multi-protocol provider support,
- auto-memory and auto-skills,
- subagents and agent teams,
- daemon/shared-session mode,
- desktop + terminal + IDE + IM bot distribution,
- computer use and structured automation breadth.

Do not inherit:

- coding-agent-first branding,
- feature sprawl without a tighter consumer-facing pet metaphor.

Primary sources:

- Qwen docs describe a terminal-first agent with codebase navigation, web retrieval, MCP external data access, direct editing, and automation.
  Source: https://qwenlm.github.io/qwen-code-docs/en/users/overview/
- Qwen's official GitHub README lists Auto-Memory, Auto-Skills, SubAgents, Agent Teams, MCP, desktop app, daemon mode, SDKs, IM channels, computer use, git worktrees, and sandboxing.
  Source: https://github.com/QwenLM/qwen-code

### Kimi Code

Useful features to borrow:

- long-horizon reasoning emphasis,
- research plus coding in one runtime,
- subagent support,
- strong "complex workflows" positioning.

Do not inherit:

- model-centric product identity,
- subscription packaging assumptions that do not fit an open-core pet platform.

Primary sources:

- Moonshot's Kimi site frames K3 around long-horizon coding, knowledge work, and deep reasoning with 1M-token context.
  Source: https://www.moonshot.ai/
- Kimi Code CLI presents software development, codebase analysis, technical tasks, web research, shell execution, and subagents.
  Source: https://www.kimi.com/code/en
- Kimi platform describes agent programming for debugging, refactoring, and multi-step development workflows.
  Source: https://platform.kimi.ai/

### OpenCode

Useful features to borrow:

- desktop + terminal + IDE availability,
- agent specialization,
- LSP-aware operation,
- multi-session parallelism,
- permission controls by tool and policy,
- shareable sessions.

Do not inherit:

- primarily coder-facing UX,
- default permissiveness without stronger consumer-facing guardrails.

Primary sources:

- OpenCode's site highlights LSP support, multi-session, share links, and terminal/IDE/desktop surfaces.
  Source: https://opencode.ai/
- OpenCode docs describe specialized agents, permission controls, policies, and agent creation.
  Sources:
  https://opencode.ai/docs/
  https://opencode.ai/docs/agents/
  https://opencode.ai/docs/config/
  https://opencode.ai/docs/permissions/
  https://opencode.ai/docs/tools/
  https://opencode.ai/docs/policies/

## Synthesis: What Smart-Pet-Agent Should Become

### Product Thesis

Most agents are either:

- highly capable but emotionally cold,
- visually delightful but operationally shallow,
- or extensible for developers but not trustworthy enough as ambient OS companions.

Smart-Pet-Agent should combine:

- PetClaw's ambient presence,
- OpenClaw's local ownership,
- Codex/Augment/Qwen/Kimi/OpenCode/Cline execution depth,
- and a first-class pet embodiment system where movement and expression come from agent reasoning rather than random timers.

### Brand And UI Direction

The product should be explicitly branded as `Smart Pet Agent`, not presented like a generic AI shell or a PetClaw derivative.

It should feel like a Street Smart NYC product:

- urban, sharp, warm, and alive,
- polished but not soft,
- expressive but never toy-like,
- operationally clear even when visually atmospheric.

Recommended visual language:

- Colors:
  - asphalt black
  - subway-tile cream
  - taxi gold
  - signal amber
  - civic blue
  - alert red for risk only
- Materials:
  - smoked glass
  - brushed steel
  - dim billboard glow
  - map-line dividers
- Motion:
  - route-trace reveals
  - subtle bounce on arrival
  - breath/pulse when thinking
  - sharp snap for approvals, warnings, and completed actions
- Typography:
  - a strong grotesk or transit-style sans for interface chrome
  - a compact monospace for logs, permissions, tools, and runtime telemetry
- Sound:
  - short tactile cues, soft transit-like chimes, no childish jingles

Recommended UX expression across surfaces:

- Overlay pet:
  - feels like a living street-side companion watching the city with you
  - compact silhouette, readable expression, clear thought states
- Bubble:
  - quick-glance status chips, action trace, confidence, permissions pending
- Chat window:
  - command center meets companion journal, not a generic chatbot
- CLI/TUI:
  - same naming, same personality, same state language as GUI

### UI Design Principles

1. Brand clarity

- Every visible surface should say `Smart Pet Agent`.
- The product must never read like a clone, wrapper, or skin for another tool.

2. NYC companion feel

- The app should feel grounded in Street Smart NYC branding through palette, copy, sound, and motion.
- Avoid pastel kawaii defaults, generic purple AI gradients, and standard SaaS dashboard styling.

3. Ambient first

- The overlay should be legible in the corner of the screen while the user works, watches video, or plays games.
- Click-through behavior, low-noise animation, and high contrast status matter more than decorative complexity.

4. Operational trust

- Permissions, active tools, delegated work, and computer-use actions should always be visible and understandable.
- The pet can feel magical, but the system behavior must stay auditable.

5. Embodied intelligence

- Every pose, glance, and movement should map to state, intention, or reasoning.
- Randomness can add texture, but it should not be the main behavioral driver.

### Core Product Pillars

1. Standalone local runtime

- Smart runs without OpenClaw.
- OpenClaw/Hermes/etc. become optional delegation peers or bridge targets.
- Local state, local permissions, local pet packs, local memory store.

2. Ambient embodiment

- Overlay pet, thought bubble, tray, chat panel, optional docked sidebar.
- Pet is visible during normal computer use, including gaming/video, through click-through and low-latency overlay behavior.
- Physical motion is intentional: listen, think, inspect, act, celebrate, caution, rest.

3. Permission-centered computer use

- Per-device and per-action permissions.
- Fine scopes for files, apps, network, mic, camera, clipboard, browser, input control.
- "Ask every time", "allow while active task", "always deny", and "always allow" modes.

4. Multi-surface continuity

- GUI overlay/chat,
- CLI,
- TUI,
- optional mobile companion later,
- optional IM bridge later,
- one memory/personality/action system underneath.

5. Evolving pet mind

- Persistent memory with retrieval and summarization.
- Mood, goals, habits, and expression tied to state.
- Safe learning from preferences and repeated workflows.
- Editable "soul/personality" contract so evolution is visible and bounded.

6. Agent federation, not agent dependence

- Smart can delegate to Codex, Hermes, Qwen, OpenCode, Cline-style agents, or custom local workers.
- Delegation is a strategy inside Smart, not Smart's identity.
- User sees one pet companion, not a router between unrelated products.

## Recommended Architecture

### Layer 1: Local Runtime

Add a dedicated runtime service under `packages/core` or a new `packages/runtime`:

- event bus for perception, reasoning, actions, and animation intents,
- durable SQLite state,
- provider abstraction,
- permission service,
- task/session manager,
- background scheduler,
- delegation adapters.

### Layer 2: Capability Services

Split current monolith responsibilities into explicit services:

- `memory-service`
- `permission-service`
- `computer-use-service`
- `voice-service`
- `peripheral-service`
- `pet-state-service`
- `delegation-service`
- `plugin-or-extension-service`

This will make the overlay, chat, and CLI thin clients over the same runtime instead of each shell inventing behavior.

### Layer 3: UI Surfaces

Short-term:

- keep Electron as the fastest route to parity with the PetClaw template,
- treat Tauri as a later migration only if it clearly reduces packaging/runtime pain.

Surfaces:

- overlay pet window,
- bubble/status window,
- chat/dashboard window,
- CLI,
- TUI.

### Layer 4: Pet Engine

Support two animation modes:

- `video` packs for quick compatibility and user-generated pets,
- `rigged` packs for high-value thought-driven motion, facial expressions, lip-sync, and locomotion.

The crucial rule:

- the runtime emits semantic animation intents such as `listen`, `inspect`, `plan`, `act`, `ask_permission`, `celebrate`, `error`, `sleep`, `travel`, `speak`,
- pet packs decide how that species/body renders the intent.

That avoids hard-coding cat-specific or fox-specific motion into the agent brain.

## What To Change In This Repo Next

### Immediate changes worth making

1. Promote standalone identity everywhere

- Remove any wording that makes Smart sound like a plugin or thin wrapper.
- Keep OpenClaw/Hermes only as optional adapters.

2. Replace Linux-only OS control assumptions

- `packages/core/src/peripheral-manager.ts` currently shells out to Linux-specific tools like `xdotool`, `grim`, and `arecord`.
- Because the user's target includes the Windows PetClaw installer, Smart needs a platform adapter model instead of a single Linux-flavored implementation.

3. Formalize permissions

- Current permissions exist in memory only.
- Move them into durable storage with policy types, scopes, audit logs, and revocation UX.

4. Split animation intent from animation asset names

- Current `animation-controller.ts` exposes direct names like `walk`, `fly`, `smile`, `talk`.
- Add an intent layer so reasoning chooses semantic state and the pet pack maps it to assets/rig controls.

5. Turn delegation into adapters

- The current `delegation-manager.ts` is a good stub, but it should evolve into adapter contracts with:
  - capability discovery,
  - health checks,
  - permission gating,
  - streaming,
  - result normalization,
  - local-vs-remote provenance.

6. Add a runtime protocol between UI and core

- The current child-process JSON-line bridge is a fine prototype.
- Define a versioned message schema for events like:
  - `agent.ready`
  - `agent.status`
  - `chat.chunk`
  - `task.started`
  - `task.permission_requested`
  - `task.tool_started`
  - `pet.intent`
  - `voice.state`

### Important non-goals

- Do not try to clone every feature from every agent.
- Do not bind the product to code-generation first.
- Do not ship raw computer-use without robust permission states and visible user feedback.
- Do not make "evolving personality" an excuse for unpredictable or unsafe behavior.

## Proposed Build Phases

### Phase 1: Standalone Runtime Hardening

Goal:

- make Smart a reliable local agent even before rich pet animation.

Deliver:

- persistent runtime service,
- durable permissions,
- cross-platform capability abstraction,
- streaming chat bridge,
- task model,
- audit log.

### Phase 2: Ambient Desktop Shell

Goal:

- match and exceed PetClaw's desktop usability.

Deliver:

- overlay pet,
- bubble state,
- click-through hover hitbox,
- tray menu,
- draggable pet,
- chat window with task history,
- voice entrypoint,
- NYC-branded visual system across overlay, bubble, tray, chat, and settings.

### Phase 3: Thought-Driven Embodiment

Goal:

- make visible actions traceable to reasoning.

Deliver:

- semantic pet intents,
- emotion/state model,
- expression and locomotion engine,
- lip-sync,
- idle behaviors derived from goals/context instead of timers alone.

### Phase 4: Computer Use And Peripherals

Goal:

- make Smart useful as an OS agent, not just a chat pet.

Deliver:

- file actions,
- app launching and control,
- keyboard/mouse/browser actions,
- camera/microphone workflows,
- screen perception,
- granular consent UX and revocation.

### Phase 5: Delegation Mesh

Goal:

- let Smart orchestrate specialist agents when needed.

Deliver:

- adapter layer for Codex, Hermes, Qwen, OpenCode, local CLIs, and API workers,
- result normalization,
- fallback routing,
- delegation provenance in UI.

### Phase 6: Pet Platform

Goal:

- let users add or generate their own custom pets safely.

Deliver:

- stable pet manifest,
- validator,
- packer,
- preview tooling,
- generated starter packs,
- rig/video compatibility modes.

## Decision Summary

Yes, Smart-Pet-Agent should be its own agent AI app instead of an OpenClaw plugin.

The best positioning is:

- standalone local OS companion,
- optional federation with other agents,
- ambient pet interface,
- Street Smart NYC visual identity,
- permission-gated computer use,
- persistent evolving personality,
- multi-surface runtime across overlay, chat, CLI, and TUI.

The PetClaw installer should be treated as:

- a UI/interaction template,
- a packaging reference,
- and a feature benchmark,

not as the runtime architecture to reproduce.

## Suggested Next Implementation Slice

If continuing from this document, the best next coding slice is:

1. create a cross-platform `permission-service`,
2. refactor `peripheral-manager.ts` into OS adapters,
3. define the runtime event protocol between core and Electron,
4. map reasoning outputs to semantic pet intents instead of direct animation names,
5. then wire the overlay/bubble/chat windows to that protocol.

## Complete Product Goals

### Identity goals

- Establish `Smart Pet Agent` as a standalone app and product identity
- Align naming, copy, motion, and visual design with Street Smart NYC branding
- Make the pet feel unique to your ecosystem rather than derivative of PetClaw or OpenClaw

### User experience goals

- Keep the pet present on the OS at all times without becoming distracting
- Support interaction by typing, clicking, voice, and later richer multimodal inputs
- Make the app feel emotionally warm, capable, and trustworthy
- Preserve continuity across overlay, dashboard, CLI, and TUI

### Agent capability goals

- Support general assistant work, research, automation, and computer use
- Support delegated specialist work across external agents without losing one unified identity
- Enable long-running tasks, proactive checks, and background work
- Allow the pet to explain what it is doing and why

### Embodiment goals

- Tie movement, expression, gaze, talk, sleep, and celebration to reasoning state
- Support facial and body expression that can grow richer over time
- Let the pet react to success, failure, waiting, listening, approvals, and environmental cues
- Support video-based pets first and richer rigged pets later

### Platform goals

- Ship a reliable Windows desktop app because the benchmark reference starts from Windows
- Keep the architecture cross-platform for macOS and Linux expansion
- Preserve one core runtime used by GUI, CLI, and TUI
- Support local-first operation with optional networked providers

### Trust and safety goals

- Make permissions granular, durable, revocable, and easy to inspect
- Show active device/computer access clearly
- Keep logs and audit traces for actions taken on the user's behalf
- Prevent hidden or accidental destructive behavior

### Ecosystem goals

- Support custom pet packs with a stable manifest and validation flow
- Add extension and plugin hooks without making the app dependent on them
- Allow optional bridges into OpenClaw, Hermes, Codex, Qwen, OpenCode, and related tools
- Prepare for later marketplace or creator workflows without blocking core product quality
