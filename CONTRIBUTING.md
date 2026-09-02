# Contributing to Smart Pet Agent

Thanks for contributing. Smart Pet Agent is MIT-licensed, local-first, and
deliberately avoids telemetry, ads, and third-party SDKs. Please keep those
principles in mind in every change.

## Ways to contribute

- Bug reports (see issue templates).
- Feature requests (use the feature-request template).
- Pull requests (see below).
- Security issues (see `SECURITY.md`, do NOT open a public issue).

## Before you open a PR

1. Read `docs/PUBLISH_READINESS_AUDIT_2026-09-01_FULL.md` for the current state.
2. Run the full gate locally:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
bash scripts/smoke.sh
```

All three must pass. `bash scripts/smoke.sh` must print `SMOKE GATE GREEN`.

3. Check the "no baked-in credentials" rule:

```bash
grep -rnE 'sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|xox[abprs]-[A-Za-z0-9-]{10,}|Bearer\s+[A-Za-z0-9._-]{20,}' apps/ packages/ scripts/
```

It must produce zero matches. Do not add API keys, Firebase project IDs,
`google-services.json`, `GoogleService-Info.plist`, or hardcoded provider
baseURLs. The user supplies their own AI provider at runtime.

4. If you add a third-party service, the user must supply their own
credentials at runtime (Settings UI or env var), and you must update
`docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md`.

## Commit messages

Use Conventional Commits:

- `feat:` new feature
- `fix:` bug fix
- `chore:` build/config/tooling
- `docs:` documentation only
- `test:` tests only
- `refactor:` no behavior change

## Pull request checklist

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (24/24)
- [ ] `bash scripts/smoke.sh` prints `SMOKE GATE GREEN`
- [ ] No baked-in credentials (grep scan is clean)
- [ ] README/docs updated if behavior changed
- [ ] No telemetry, ads, or tracking SDKs added

## Style

- TypeScript, ES modules, `tsc --noEmit` clean.
- Keep the Pet Creator's `.smartpet` format (JSON envelope `version: 1`)
  backward-compatible. Changing the format requires a migration path and a
  note in `docs/PUBLISH_REMEDIATION_PLAN_2026-09-01.md`.
