# Smart Pet Agent

> Free, open-source (MIT), local-first AI OS companion. A Street Smart NYC
> desktop + mobile pet agent that thinks, learns, acts, and grows across
> desktop, CLI, TUI, and Android — with your own AI provider, on your own device.

[![CI](https://github.com/realstreetsmartnyc/smart-pet-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/realstreetsmartnyc/smart-pet-agent/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/realstreetsmartnyc/smart-pet-agent/releases)

---

## What it is

Smart Pet Agent is a **standalone ambient AI companion** that lives on your
machine. Unlike a chat window, it has a presence — a pet that watches, listens,
thinks, and acts under your explicit permission.

It is:

- **local-first and operator-owned** — no cloud dependency, no account required
- **your-AI-your-endpoint** — bring your own provider (local Ollama, LiteLLM,
  OpenAI-compatible, Anthropic, Google, custom). The app ships no provider
  credentials.
- **no telemetry, no ads, no tracking** — what you type, store, and configure
  stays on your device
- **expressive, not noisy** — NYC night-transit, storefront glow, steel, and
  signal lights shape the design

## Features

- 🧠 **Multi-provider AI** — Ollama, LiteLLM, OpenAI, Anthropic, Google, custom APIs
- 🤖 **Agent federation** — delegate to specialist agents when useful
- 🖥️ **Computer use** — mouse, keyboard, screen, apps, files, browser, workflows,
  all under explicit permission
- 📷 **Peripherals** — camera, microphone, speakers, and device capabilities you control
- 🗣️ **Voice** — TTS, STT, wake flow, and conversational control
- 🎭 **Thought-driven embodiment** — walk, fly, smile, talk, sleep, watch, inspect,
  celebrate, and react based on reasoning (not random timers)
- 🧬 **Ever-evolving** — learns preferences, adapts tone, grows safely over time
- 🏙️ **NYC-branded experience** — Street Smart NYC design language across desktop,
  CLI, TUI, and mobile
- 📱 **Multi-surface** — Electron desktop, CLI, TUI, and Android
- 🔌 **Pet platform** — custom pets, pack validation, `.smartpet` export/import,
  and an optional marketplace path

## Verified behavior (v1.0.0)

| Check | Result |
|---|---|
| `pnpm typecheck` (core + cli + tui) | exit 0 |
| `pnpm test` | 24/24 pass |
| `bash scripts/smoke.sh` | SMOKE GATE GREEN (7/7 stages) |
| `bash scripts/e2e-electron.sh` (packaged runtime) | GREEN — agent.ready, 11 chunks, history:2, permission persist |
| `scripts/verify-android-apk.sh` | PASS (173,182,966 bytes) |
| `apksigner verify` (debug APK) | PASS (v1 + v2 schemes) |
| `pnpm install --frozen-lockfile` | clean |

## Architecture

```
smart-pet-agent/
├── apps/
│   ├── electron/     # Desktop GUI (Electron 33.4.11) — AppImage + deb + NSIS + DMG
│   ├── mobile/       # Android (React Native / Expo SDK 51) + iOS (planned)
│   ├── cli/          # `smart-pet` command-line interface (esbuild CJS bundle)
│   └── tui/          # `smart-pet-tui` terminal UI (Ink, esbuild ESM bundle)
├── packages/
│   ├── core/         # Agent loop, AI manager, memory, permissions, Pet Creator
│   └── ui-tokens/    # Single-source design tokens (tokens.css)
├── scripts/          # smoke.sh, e2e-electron.sh, verify-*.sh
├── pets/             # default-nyc-orb (installed pet pack)
└── docs/             # Audit, remediation, runbook, release checklists
```

## Quick start

### Install from a release

Download the latest release from
[GitHub Releases](https://github.com/realstreetsmartnyc/smart-pet-agent/releases):

- **Linux**: `Smart Pet Agent-1.0.0.AppImage` (run, no install) or
  `smart-pet-agent_1.0.0_amd64.deb` (`sudo dpkg -i`)
- **Android**: `app-debug.apk` (sideload via `adb install`) — debug-signed,
  for evaluation
- **CLI/TUI**: `node apps/cli/dist/index.cjs` / `node apps/tui/dist/index.js`

### Build from source

```bash
git clone https://github.com/realstreetsmartnyc/smart-pet-agent.git
cd smart-pet-agent
pnpm install --frozen-lockfile

# CLI
pnpm --filter @smart-pet/cli build
node apps/cli/dist/index.cjs

# TUI (requires a real terminal)
pnpm --filter @smart-pet/tui build
node apps/tui/dist/index.js

# Desktop (Electron)
pnpm --filter ./apps/electron run build:linux
```

## Configuration — bring your own AI provider

The app does not bundle any AI provider credentials or a default cloud
endpoint. In Settings, add your provider:

- **Local Ollama**: `baseURL=http://127.0.0.1:11434`, no API key
- **LiteLLM**: `baseURL=http://your-host:4000/v1`, your API key
- **OpenAI-compatible**: any `baseURL` + your API key
- **Anthropic / Google**: your API key

Outbound network is limited to the `baseURL` you configure. Nothing else phones
home.

## Privacy

See `docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md` for the full Data Safety form.
Summary:

- Chat history, permissions, and pet state are stored **on-device** (SQLite).
- No analytics, crash reporting, or tracking SDKs are bundled or initialized.
- The app does not send data to any server except the AI provider `baseURL`
  you configure.

## Security

Report vulnerabilities privately: `security@streetsmartnyc.cloud`.
See [`SECURITY.md`](SECURITY.md) for the policy and response SLA.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). The short version:

- Run `pnpm typecheck && pnpm test && bash scripts/smoke.sh` before a PR.
- Do not add API keys, Firebase project IDs, or hardcoded provider baseURLs.
- Do not add telemetry, ads, or tracking SDKs.

## Support the project

Smart Pet Agent is MIT-licensed and free to use. If it makes your day better:

- ⭐ Star this repo
- 🐛 File issues and PRs
- 💸 [Sponsor on GitHub](https://github.com/sponsors/realstreetsmartnyc)
- ☕ [Buy us a coffee on Ko-fi](https://ko-fi.com/smartpetagent)
- 🎁 [Donate via Open Collective](https://opencollective.com/smart-pet-agent)

Funding is optional and purely additive — no feature is paywalled. See
[`docs/Monetization.md`](docs/Monetization.md) for the full model.

## License

[MIT](LICENSE) © 2026 Smart-Pet-Agent Contributors.
