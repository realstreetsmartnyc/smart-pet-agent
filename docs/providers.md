# Providers

Smart Pet Agent routes AI calls through a single `packages/core` runtime (`AIManager`, `AgentLoop`, `MemoryStore`). Every surface — Electron, CLI, TUI, mobile — is a thin shell over that core (see [Architecture](architecture.md)).

## What a “provider” is

- **LLM providers** — chat/completion backends: Ollama, LM Studio, LiteLLM, OpenAI, Anthropic, Google, or any OpenAI-compatible `custom` endpoint. Details and per-type setup in [LLM Providers](llm-providers.md).
- **Agent providers** (federation) — delegate subtasks to specialist agents (Hermes, Codex, Gemini, Qwen, OpenCode, etc.) via `delegation-manager.ts` when useful.
- **Peripheral providers** — controlled access to screen, camera, microphone, speakers, and files under the permission policy ([TRUST.md](TRUST.md), [MOBILE_TRUST.md](MOBILE_TRUST.md)).

## Fallback chain

`AIManager` stores providers in a `Map` and a `fallbackChain` (default = insertion order). `chat()` tries each provider in order until one succeeds; failures log `[AI] Provider "<name>" failed, trying next...` and auth/network errors surface at chat-time, not init-time, for OpenAI-compatible endpoints.

## Configure

Use **Settings → Model Providers** in the desktop app, or seed `packages/core`’s `AIManager` constructor with a `Record<string, AIProvider>`. No keys are baked into the repo — the user supplies them at runtime (see [Contributing](contributing.md) credential rule and [TRUST.md](TRUST.md)).

## Further reading

- [LLM Providers](llm-providers.md) — type table, `AIProvider` interface, ping/streaming notes
- [Onboarding](ONBOARDING.md) — provider step in the first-run flow
- Source: `packages/core/src/ai-manager.ts`, `packages/core/src/agent-loop.ts`
