# Publish Readiness Summary — Smart Pet Agent v1.0.0

**Date:** 2026-09-02
**Branch:** chore/v1.0.0-alpha-1-staging (commit 8386b05)
**Target:** v1.0.0 public (GitHub + installers)

## ✅ Already Done (verified in repo)

| Item | File | Status |
|------|------|--------|
| MIT License | `LICENSE` | :white_check_mark: |
| Security policy | `SECURITY.md` | :white_check_mark: (security@streetsmartnyc.cloud) |
| Code owners | `.github/CODEOWNERS` | :white_check_mark: (realstreetsmartnyc) |
| Funding / sponsors | `.github/FUNDING.yml` | :white_check_mark: (Sponsors + Open Collective + Ko-fi + custom) |
| Issue templates | `.github/ISSUE_TEMPLATE/*` | :white_check_mark: (bug, feature, security) |
| PR template | `.github/PULL_REQUEST_TEMPLATE.md` | :white_check_mark: |
| Contributing guide | `CONTRIBUTING.md` | :white_check_mark: |
| Changelog | `CHANGELOG.md` | :white_check_mark: |
| CI workflow | `.github/workflows/ci.yml` | :white_check_mark: |
| No baked credentials | `grep` scan | :white_check_mark: |
| Electron: dot-prop removed | `apps/electron/package.json` | :white_check_mark: |
| Electron: conf/dot-prop asarUnpack | `apps/electron/electron-builder.json` | :white_check_mark: |
| Mobile: real Expo projectId | `apps/mobile/app.json` | :white_check_mark: (315746d3-...) |
| CODE_OF_CONDUCT | `CODE_OF_CONDUCT.md` | :white_check_mark: (Covenant 2.1) |
| README publish-ready | `README.md` | :white_check_mark: (realstreetsmartnyc, public v1.0.0, roadmap) |
| User guide | `USER_GUIDE.md` | :white_check_mark: |
| Architecture | `ARCHITECTURE.md` | :white_check_mark: |
| Pricing | `PRICING.md` | :white_check_mark: (from Monetization.md) |
| Banner / social preview | `docs/banner.svg` + `banner.png` | :white_check_mark: (1280x640 NYC vibe) |
| Monetization plan | `docs/Monetization.md` | :white_check_mark: |
| GitHub page: description + topics | GitHub API | :white_check_mark: |
| better-sqlite3 ABI 130 (Linux) | `apps/electron/node_modules/.../better_sqlite3.node` | :white_check_mark: |

## 🔲 Remaining Before Public Flip

| Priority | Item | Owner | ETA |
|----------|------|-------|-----|
| P0 | Commit remaining hygiene (CHANGELOG, SUPPORT, dist, pnpm-lock, scripts) | dev | now |
| P0 | Verify CI green (test + lint) | dev | this push |
| P0 | Cut `v1.0.0` tag (`git tag -a v1.0.0`) | dev | after CI green |
| P0 | Flip repo to public (GitHub → Settings → Visibility) | dev | after tag |
| P0 | Create GitHub Release v1.0.0 with installer artifacts | dev | after public |
| P1 | Set social preview image (Settings → Social preview → upload `docs/banner.png`) | dev | after public |
| P1 | Build & upload installers: Linux AppImage/deb, Windows NSIS (pending WIN_CSC_LINK), macOS DMG (pending CSC_LINK) | CI | after tag |
| P1 | Verify installers on clean VMs (`scripts/verify-*.sh`) | QA | after artifacts |
| P2 | Marketing: posts per `docs/MARKETING_EXPOSURE_PLAN_2026-09-01.md` | marketing | after release |

## Monetization (already planned)

- **Active at v1.0.0:** GitHub Sponsors, Open Collective, Ko-fi, direct (streetsmartnyc.cloud/donate) — see [docs/Monetization.md](docs/Monetization.md) and [PRICING.md](PRICING.md)
- **Post-v1.0.0 (opt-in):** Premium pet packs ($0.99–$4.99), managed sync (~$2.99/mo, ciphertext-only), premium support contracts
- **Guarantees:** No ads, no telemetry, no proprietary code, no paywalled feature in OSS build

## How to Publish (copy-paste)

```bash
# 1. Stage remaining hygiene
git add CHANGELOG.md SUPPORT.md KNOWN_ISSUES.md MOBILE_BUILD.md pnpm-lock.yaml scripts/ docs/ apps/electron/dist/
git commit -m "chore: publish hygiene — remaining docs + dist"

# 2. Push and wait for CI
git push
gh run watch

# 3. Tag and release
git tag -a v1.0.0 -m "Smart Pet Agent v1.0.0 — public"
git push --tags
gh release create v1.0.0 --title "v1.0.0 — Public" --notes-file docs/RELEASE_NOTES_v1.0.0.md --latest

# 4. Make public
gh repo edit realstreetsmartnyc/smart-pet-agent --visibility public --accept-visibility-change-consequences

# 5. Upload social preview (UI): Settings → Social preview → docs/banner.png
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Windows NSIS / macOS DMG fail without signing secrets | Source + CI ready; set `WIN_CSC_LINK`, `CSC_LINK` secrets when available. Linux AppImage is the v1.0.0 reference. |
| better-sqlite3 ABI drift | Pinned to 11.0.0, rebuilt on each CI run via `electron-rebuild` |
| Mobile EAS creds missing | Android local APK works now; EAS/Play Internal pending secrets (see `scripts/verify-eas-identity.sh`) |

---
*Generated from `docs/PUBLIC_RELEASE_CHECKLIST_2026-09-02.md` and live repo state. All icons in this file are :white_check_mark: verified.*
