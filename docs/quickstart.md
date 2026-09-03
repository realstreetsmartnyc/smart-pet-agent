# Quickstart

Get Smart Pet Agent running locally in under 5 minutes.

## Prerequisites

- Node 20+, `pnpm` 9.4 (see `.nvmrc`), and Git
- For desktop: system webview / Electron deps (Linux `xvfb` for headless runs)

## Install & run (desktop — dev)

```bash
git clone https://github.com/realstreetsmartnyc/smart-pet-agent.git
cd smart-pet-agent
pnpm install --frozen-lockfile
pnpm --filter @smart-pet/desktop dev
```

Other shells:

```bash
pnpm --filter @smart-pet/cli start      # CLI
pnpm --filter @smart-pet/tui start      # TUI
```

## Configure a provider

1. Open **Settings → Model Providers**.
2. Add **Ollama** (local, no key) — e.g. `http://localhost:11434` + model `llama3.1` — or add an OpenAI / Anthropic API key via a LiteLLM / OpenAI-compatible endpoint.
3. The runtime tries providers in your fallback chain (see [Providers](providers.md) and [LLM Providers](llm-providers.md)) and logs `[AI] Provider "<name>" ready` on success.

Headless check:

```bash
SMART_PET_TEST=1 pnpm test   # skips live provider pings
```

## First task

Grant permissions at **Settings → Devices** (screen / microphone / apps / files are deny-by-default — see [TRUST.md](TRUST.md)), then chat *“Hello Smart”* and watch the overlay bubble, `pet.intent`, and runtime status updates.

## Next steps

- [Onboarding](ONBOARDING.md) — full first-run flow and troubleshooting (`bash scripts/smoke.sh`)
- [Custom Pet Spec](CUSTOM_PET_SPEC.md) and [Templates](templates.md) to add a pet pack
- [Architecture](architecture.md) for the `packages/core` single-runtime model
