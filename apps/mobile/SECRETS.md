# EAS Submit Secrets (apps/mobile)

The EAS submit pipeline references two local credentials that **must never be committed**:

| File | Purpose | Gitignored? |
| --- | --- | --- |
| `./service-account-key.json` | Google Play service account JSON (Android track upload) | yes (`service-account-key.json`) |
| `./asc-api-key.p8` | App Store Connect API key (iOS submission) | yes (`*.p8`, plus `asc-api-key.p8`) |

## Why

A leaked service-account-key.json can let an attacker upload malicious APKs/AABs to your Play Console tracks. A leaked asc-api-key.p8 can grant App Store Connect API access. EAS resolves these paths at submit time and ships them via TLS, so local-only storage is sufficient.

## How to provision locally

1. **Android** — Google Play Console → Setup → API access → "Create service account", download JSON, drop it as `apps/mobile/service-account-key.json`. The path is already wired in `eas.json` (`serviceAccountKeyPath`).
2. **iOS** — App Store Connect → Users & Access → Keys → "Generate API Key", download `.p8`, drop it as `apps/mobile/asc-api-key.p8`. The path is wired in `eas.json` (`ascApiKeyPath`).

## Verifying

```sh
git check-ignore service-account-key.json asc-api-key.p8
# both must exit 0
```

If either command exits 1, the file is **not** ignored and you must remove it from the index / disk immediately and rotate the credential.

## Rotation

If a key ever leaks: revoke it in the upstream console (Play Console / App Store Connect), generate a replacement, and re-run the local provisioning step above.
