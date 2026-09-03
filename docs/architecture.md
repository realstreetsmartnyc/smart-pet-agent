# Architecture

> Sourced from `ARCHITECTURE.md` at repo root (single source of truth).

# Smart Pet Agent — Architecture

> One runtime, many surfaces. `packages/core` is the single source of truth; Electron, CLI, TUI, and mobile are thin shells.

## Module Tree

```
smart-pet-agent/
├── apps/
│   ├── electron/            # Desktop GUI — Electron 33.4.11 + electron-builder
│   │   ├── src/main.js      # 3 windows (overlay, bubble, chat), tray, IPC, agent bridge
│   │   ├── src/preload.js   # contextBridge → window.electronAPI
│   │   ├── src/agent-runtime.mjs  # bundled core for packaged builds (scripts/build-agent-runtime.mjs)
│   │   ├── electron-builder.json  # AppImage+deb (linux), NSIS (win), DMG (mac), asarUnpack
│   │   └── assets/          # icon.icns / icon.ico / tray pngs
│   ├── cli/                 # @smart-pet/cli — `smart-pet` CJS 97 KB (esbuild)
│   │   └── src/index.ts     # interactive + one-shot, grant/revoke/delegate/state/memory
│   ├── tui/                 # @smart-pet/tui — Ink React TUI, ESM 2.1 MB
│   │   └── src/index.tsx    # TTY detection + streaming chat
│   └── mobile/              # React Native / Expo SDK 51 (ai.smartpet.agent, targetSdk 34)
│       ├── App.tsx          # NYC shell, permission flows, chat simulation
│       ├── src/memory-mobile.ts   # MobileMemoryStore on expo-sqlite
│       ├── src/useRuntimeEvents.ts # RuntimeEvent hook (chat.chunk/done, pet.intent…)
│       ├── src/permission-mobile.ts # expo-camera/av/notifications/local-auth
│       ├── app.json / eas.json    # EAS preview (APK) + production (AAB)
│       └── android/         # prebuilt native (gradle, MainActivity.kt)
├── packages/
│   ├── core/                # @smart-pet/core — agent loop, AI, memory, pets, trust
│   │   └── src/
│   │       ├── agent-loop.ts        # perception→memory→reasoning→action→learning
│   │       ├── ai-manager.ts        # multi-provider (Ollama/LiteLLM/OpenAI/Anthropic/Google/custom)
│   │       ├── memory.ts            # SQLite (better-sqlite3 ABI 130) + in-memory test fallback
│   │       ├── runtime-events.ts    # RuntimeEvent v1 NDJSON: status/chat/permission/pet/task/history
│   │       ├── permission-service.ts# per-action policy + logAudit + CONFIRMATION_REQUIRED
│   │       ├── peripheral-manager.ts# screen/camera/mic/mouse/keyboard/apps/files + capabilities probe
│   │       ├── delegation-manager.ts# fan-out to Hermes/Codex/Gemini/Qwen/OpenCode
│   │       ├── pet-creator.ts       # image ingest (MIME+magic), validation, activation, .smartpet
│   │       ├── pet-validator.ts / pet-source.ts / pet-workspace.ts / pet-generator.ts
│   │       └── animation-controller.ts # 11 intents → halo + CSS orb transitions
│   └── ui-tokens/           # @smart-pet/ui-tokens — single-source tokens.css (asphalt/taxi/signal/civic)
├── pets/
│   └── default-nyc-orb/     # manifest.json + pet.config.json + assets/preview.svg (canvas engine)
├── scripts/                 # smoke.sh, e2e-electron.sh, verify-android-apk.sh
└── docs/                    # runbook, checklists, trust, monetization
```

## Runtime Flow

```
User Input → Perception → Memory Retrieval → Reasoning (AI manager) → Action Planner
          → Permission Check (deny-by-default) → Execution (peripherals/spawn)
          → Audit Log → Pet Embodiment (11 intents) → Response (streaming chat.chunk)
```

Every action emits a `RuntimeEvent` audited to SQLite. No telemetry or bundled creds — network only to your `baseURL`.

## Cross-Surface Invariants

- **Single core**: `apps/electron`, `apps/cli`, `apps/tui`, `apps/mobile` all import `@smart-pet/core`; no forked logic.
- **Permission-gated**: `PeripheralManager.validateComputerAction` + `permission-service` on every `computer_use`/`spawn`; `DESTRUCTIVE_ACTIONS=[]` in v1.
- **Design tokens**: `packages/ui-tokens/tokens.css` is the only `:root` source; Electron + mobile import it.
- **Pet spec**: `docs/CUSTOM_PET_SPEC.md` — `.smartpet` JSON envelope `version:1`, backward-compatible.

See `docs/PUBLISH_PLAN_ALL_PLATFORMS_2026-09-01.md` for the publish lanes and `docs/TRUST.md` / `docs/PETS.md` for deeper internals.
