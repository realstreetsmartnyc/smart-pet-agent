# LLM Providers

Focused reference for the chat providers supported by `packages/core/src/ai-manager.ts`.

## Supported types

| `AIProvider.type` | Backend | Base URL example | Auth | Capability notes |
|---|---|---|---|---|
| `ollama` | Ollama | `http://localhost:11434` | none / bearer | `GET /api/tags` ping; local-first |
| `lmstudio` | LM Studio | `http://localhost:1234/v1` | optional key | OpenAI-compatible |
| `litellm` | LiteLLM proxy | `http://localhost:4000` | bearer | OpenAI-compatible |
| `openai` | OpenAI | `https://api.openai.com/v1` | `sk-...` | OpenAI-compatible |
| `anthropic` | Anthropic | `https://api.anthropic.com` | `x-api-key` | Routed via OpenAI-compatible path |
| `google` | Google Generative AI | `https://generativelanguage.googleapis.com` | API key | Routed via OpenAI-compatible path |
| `custom` | Any OpenAI-compatible | e.g. `https://api.poolside.ai/v1` | bearer | User-supplied `baseURL` |

All non-Ollama types use `chatOpenAICompatible()`; Ollama uses `chatOllama()`.

## `AIProvider` shape

```ts
interface AIProvider {
  name: string;
  type: 'ollama'|'lmstudio'|'litellm'|'openai'|'anthropic'|'google'|'custom';
  baseURL: string;
  apiKey?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  capabilities: ('chat'|'vision'|'tools'|'streaming')[];
}
```

## Init & fallback

`AIManager.initialize()` pings Ollama via `GET /api/tags` and skips the probe for OpenAI-compatible hosts (avoids false 404/401). Failures are warned, not fatal. `chat()` walks `fallbackChain` and `ping()` is only strict for true network/DNS failures.

## Tips

- Prefer Ollama for offline, operator-owned runs; add a cloud provider as fallback.
- Keep keys out of git — see [Contributing](contributing.md) `grep` gate and [TRUST.md](TRUST.md).
- See [Providers](providers.md) for federation/peripheral context and [Onboarding](ONBOARDING.md) for first-run wiring.
