# FAQ

Short answers sourced from the existing docs. Follow the linked pages for full detail.

**Is Smart Pet Agent ready to install from a store?**

No — private alpha / technical preview. See [Release Checklist](RELEASE_CHECKLIST.md) and [PUBLISH_READINESS_AUDIT_2026-09-01_FULL.md](PUBLISH_READINESS_AUDIT_2026-09-01_FULL.md) for current gates.

**How do I run it locally?**

Clone, `pnpm install`, `pnpm --filter @smart-pet/desktop dev`. See [Quickstart](quickstart.md) and [Onboarding](ONBOARDING.md).

**Do I need an API key?**

No. Use Ollama locally with no key, or add OpenAI/Anthropic/Google or any OpenAI-compatible endpoint in **Settings → Model Providers**. See [LLM Providers](llm-providers.md).

**Where are my keys stored?**

Locally, user-supplied at runtime. The repo enforces a no-baked-credentials rule (`grep` gate in [Contributing](contributing.md)).

**How do permissions work?**

Deny-by-default for `screen`/`camera`/`microphone`/`apps`/`files`, with per-action checks and audit logging. See [TRUST.md](TRUST.md) and [MOBILE_TRUST.md](MOBILE_TRUST.md).

**How do I add a custom pet?**

Follow [CUSTOM_PET_SPEC.md](CUSTOM_PET_SPEC.md) or copy a [Templates](templates.md) scaffold. Validate with `bash scripts/validate-pet.sh --checkAssets`.

**What surfaces exist?**

Desktop (Electron + Tauri), CLI, TUI, and scaffolded mobile (Expo). Architecture in [Architecture](architecture.md) (`packages/core` is the single runtime).

**I found a bug — how do I report it?**

Open a GitHub issue (bug report / feature request templates) and include `pnpm typecheck` / `pnpm test` / `bash scripts/smoke.sh` output per [Contributing](contributing.md).
