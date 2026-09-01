# Smart Pet Agent — Onboarding (v1.0.0)
First-run flow for the current development build. It is not yet a publish guarantee.

1. Install: `pnpm install` then `pnpm --filter @smart-pet/desktop dev` (Tauri) or Electron `apps/electron`.
2. Provider setup: Settings → Model Providers → add Ollama (local) or OpenAI/Anthropic key. Provider fallback is present but still needs release-grade configuration and failure testing.
3. Permissions: Settings → Devices — grant `screen`/`microphone` explicitly. Each grant is durable in SQLite and revocable; action-level enforcement and audit visibility remain under validation.
4. Pet: `default-nyc-orb` validates successfully; public-release asset and expression review is still pending.
5. First task: Chat "Hello Smart" → observe runtime status, `pet.intent`, and bubble updates. Full streaming/provider coverage remains a QA gate.
6. Trust: audit-log retrieval exists in the runtime bridge; the user-facing Memory/audit surface is still being completed.

Troubleshoot: `bash scripts/smoke.sh` is a development smoke gate, not sufficient by itself for publish. Release logs and the Windows installer still require verification.
