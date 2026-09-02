## Summary

What does this PR do? Keep it to one or two sentences.

## Linked issue

Closes #<issue-number> (if any).

## Test plan

What did you run, and what passed?

- [ ] `pnpm typecheck`
- [ ] `pnpm test` (24/24)
- [ ] `bash scripts/smoke.sh` → `SMOKE GATE GREEN`

## No-baked-credentials check

- [ ] `grep -rnE 'sk-|AIza|AKIA|ghp_|xox[abprs]-' apps/ packages/ scripts/` is clean
- [ ] No Firebase project IDs / `google-services.json` / `GoogleService-Info.plist`
- [ ] No hardcoded provider baseURLs; the user supplies their own at runtime

## Docs

- [ ] README/docs updated if behavior changed
- [ ] Data Safety form (`docs/PLAY_CONSOLE_DATA_SAFETY_v1.0.0.md`) updated if a
      third-party integration was added or removed

## Other

Anything the reviewer should know (trade-offs, follow-ups, screenshots).
