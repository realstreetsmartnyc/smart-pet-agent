# Smart Pet Agent

<p align="center"><img src="docs/banner.svg" width="640" alt="Smart Pet Agent banner"/></p>

> Free, open-source, ever-evolving AI OS companion.
> A Street Smart NYC desktop pet agent that thinks, learns, acts, and grows across desktop, CLI, TUI, and future mobile surfaces.

## Vision

Smart Pet Agent is a **standalone ambient AI companion app** that lives on your computer. Unlike simple desktop pets, Smart is driven by **agent thought**: every action, animation, and response is reasoned, not randomized.

The product should feel unmistakably like a Street Smart NYC app:

- confident, warm, fast, and urban rather than cutesy-generic,
- local-first and operator-owned rather than cloud-dependent,
- expressive enough to feel alive without becoming noisy or toy-like,
- visually shaped by NYC night transit, storefront glow, steel, signal lights, and street-level motion.

- 🧠 **Multi-provider AI**: Ollama, LM Studio, LiteLLM, OpenAI, Anthropic, Google, custom APIs
- 🤖 **Agent federation**: Delegate to Hermes, Codex, Gemini, Qwen, OpenCode, and other specialists when useful
- 🖥️ **Computer use**: Mouse, keyboard, screen, apps, files, browser, and workflows under explicit permission rules
- 📷 **Peripherals**: Camera, microphone, speakers, and device capabilities you control
- 🗣️ **Voice**: TTS, STT, wake flow, and conversational control
- 🎭 **Thought-driven embodiment**: Walk, fly, smile, talk, sleep, watch, inspect, celebrate, and react based on reasoning
- 🧬 **Ever-evolving**: Learns preferences, adapts tone, and grows safely over time
- 🏙️ **NYC-branded experience**: Street Smart NYC design language across overlay, dashboard, CLI, and pet packs
- 📱 **Multi-surface**: Desktop app first, plus CLI, TUI, and later mobile/companion surfaces
- 🔌 **Pet platform**: Custom pets, pack validation, extension hooks, and optional marketplace paths

## Brand Direction

Smart Pet Agent should not look like a generic AI dashboard. The visual system should feel:

- `Street-smart`: sharp, capable, composed, and useful
- `NYC-native`: transit-map logic, late-night neon warmth, borough grit, glass, steel, and amber signal accents
- `Companion-first`: expressive and alive, but never childish or chaotic
- `Operational`: task status, permissions, and device activity always readable at a glance

Working design cues:

- Primary palette: asphalt charcoal, subway tile ivory, signal amber, taxi gold, civic blue, and warning red used sparingly
- Surfaces: frosted glass, brushed dark metal, map-line dividers, and soft billboard glows
- Motion: small purposeful slides, hover glints, route-line traces, pulse on thought/activity, no generic floating blobs
- Typography direction: editorial sans or transit-inspired grotesk paired with a compact mono for status and tool telemetry
- Pet vibe: city-aware, observant, quick, confident, helpful, slightly mischievous, never saccharine

## Architecture

```
smart-pet-agent/
├── apps/
│   ├── desktop/      # Tauri 2.x shell (Rust + WebView)
│   ├── cli/          # `smart-pet` command-line interface
│   └── tui/          # Terminal UI
├── packages/
│   ├── core/         # Agent loop, AI manager, memory, delegation
│   ├── voice/        # TTS, STT, voice cloning
│   ├── peripherals/  # Camera, screen, mouse, keyboard
│   ├── plugins/      # Plugin API + marketplace
│   └── sync/         # Cross-device cloud sync
└── docs/
```

## Quick Start

```bash
# Clone
git clone https://github.com/realstreetsmartnyc/smart-pet-agent.git
cd smart-pet-agent

# Install
pnpm install

# Run CLI (dev)
pnpm cli "Hello, Smart!"

# Run Desktop (dev)
pnpm dev

# Build for production
pnpm build
```

## Agent Loop

```
User Input → Perception → Memory Retrieval → Reasoning → Action Execution → Learning → Response
```

Every agent action has a **reasoning explanation** — Smart doesn't move randomly, it thinks first.

## Pet Modes

| Mode | Description |
|------|-------------|
| **Desktop Pet** | Cursor-following sprite with mood colors, breathing, blinking |
| **Tamagotchi** | Care loop (feed/wash/walk), evolution stages |
| **3D Companion** | Full avatar with voice, gestures, lip-sync, room |
| **Terminal Agent** | Bidirectional terminal in pet window |
| **Hybrid** | Any combination user chooses |

## Monetization (OpenCore)

- **Free Core**: MIT-licensed, always free
- **Premium Plugins**: $2.99–$9.99
- **Skin Packs**: $0.99–$4.99
- **Cloud Sync**: $2.99/month
- **Creator Marketplace**: 70/30 revenue split

## Goals

- Build Smart Pet Agent as a standalone app, not a plugin dependency
- Keep an always-on ambient desktop pet presence that coexists with games, video, and normal work
- Support chat, voice, click, and future multimodal interaction
- Make computer use explicit, permission-gated, and visibly auditable
- Support local and hosted model providers without locking the product to one vendor
- Let the pet's motion, face, and body reflect agent reasoning instead of random timers
- Preserve one runtime across GUI, CLI, TUI, and later mobile/companion surfaces
- Add durable memory that improves usefulness without hiding what was learned
- Allow optional delegation to specialist agents while preserving one Smart Pet Agent identity
- Create a stable custom pet spec so users can add unique pets safely
- Align UI, motion, language, and sound with Street Smart NYC branding
- Ship a polished Windows-capable desktop experience because the current benchmark starts from a Windows installer

## Roadmap

- [x] Phase 0: Core agent loop, multi-provider AI, memory, CLI
- [x] Phase 1: Standalone runtime hardening, permissions, event protocol — **verified on Linux** (`RuntimeEvent` v1, SQLite ABI 130, per-action policy + `logAudit`, `spawn` adapters, `agent.ready`, `chat.history` + streaming)
- [x] Phase 2: Desktop shell and NYC-branded overlay/dashboard — **verified on Linux** (Electron 33.4.11, single-source `tokens.css`, 6 pages `chat/tasks/devices/permissions/pets/settings`, overlay + bubble + tray)
- [x] Phase 3: Thought-driven pet embodiment — **verified** (11-intent canvas orb, halo per `pet.config.json`, `validatePetPack` ok, `default-nyc-orb`; video/rigged pets deferred)
- [x] Phase 4: Computer use + peripherals — **verified on Linux** (deny-by-default + `validateComputerAction`, `logAudit`, `capabilities` probe, `conf` packaged; Windows/macOS live QA pending)
- [ ] Phase 5: Agent federation and delegation mesh
- [ ] Phase 6: Custom pet platform and creator tooling (Creator MVP verified: `pet-creator.ts`, 9 tests; store UI deferred)
- [x] Phase 7: Marketing, exposure, and launch prep — **shipped for v1.0.0** (README, waitlist, demo assets, press kit, `docs/MARKETING_EXPOSURE_PLAN_2026-09-01.md`)
- [~] Phase 8: Android/iOS mobile — **Android local APK verified**, EAS preview/Play Internal pending secrets; iOS deferred (needs Apple Developer account)

Current status: **v1.0.0 public**. Core is shippable: Linux desktop (AppImage 112 MB + deb 75 MB, installed and e2e GREEN), CLI (`smart-pet` CJS 97 KB), TUI (`smart-pet-tui` ESM 2.1 MB), and Custom Pet Creator MVP are verified. Windows NSIS and macOS DMG are source + CI ready (`windows-latest`/`macos-latest` runners, pending `WIN_CSC_LINK`/`CSC_LINK` signing secrets). Android debug APK is built and `apksigner` PASS (EAS/Play pending). iOS deferred. See [`docs/PUBLIC_RELEASE_CHECKLIST_2026-09-02.md`](docs/PUBLIC_RELEASE_CHECKLIST_2026-09-02.md) for the full gate table and [`docs/PUBLISH_RUNBOOK_v1.0.0.md`](docs/PUBLISH_RUNBOOK_v1.0.0.md) for artifact reproduction.

## License

MIT — see [LICENSE](LICENSE)
