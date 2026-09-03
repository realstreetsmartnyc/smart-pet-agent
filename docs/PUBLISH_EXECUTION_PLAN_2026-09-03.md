# Smart Pet Agent — Publish Execution Plan
**Date**: 2026-09-03
**Goal**: Complete all 14 remaining publish-readiness items and ship v1.0.0 publicly

---

## Phase 1: Documentation & Repo Hygiene (High Priority)

### Item 1.1 — Create CODE_OF_CONDUCT.md
**Goal**: Add Contributor Covenant 2.1 to repo root

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 1.1.1 Write file | `cat > CODE_OF_CONDUCT.md <<'EOF' ... EOF` | File exists at root |
| 1.1.2 Verify format | `head -20 CODE_OF_CONDUCT.md` | Contains Contributor Covenant 2.1 header |

### Item 1.2 — Fix README.md Placeholders
**Goal**: Replace `YOUR_ORG` with `realstreetsmartnyc` and remove private-alpha framing

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 1.2.1 Fix clone URL | `sed -i 's|YOUR_ORG|realstreetsmartnyc|g' README.md` | `grep -n realstreetsmartnyc README.md` shows line 66 |
| 1.2.2 Remove private-alpha language | `sed -i '/private alpha \/ technical-preview hardening/d' README.md` | Line 135 no longer mentions "private alpha" |
| 1.2.3 Add public release framing | Insert "Public v1.0.0 release — installers available for Linux, Windows, macOS" after Quick Start | `grep -n "Public v1.0.0" README.md` returns match |

### Item 1.3 — Create USER_GUIDE.md
**Goal**: Full CLI reference with 11 commands, provider env vars, base:label syntax

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 1.3.1 Scaffold structure | Create sections: Install, Quick Start, Commands, Providers, Configuration, Troubleshooting | File exists with 11 command docs |
| 1.3.2 Document 11 CLI commands | `smart-pet`, `smart-pet chat`, `smart-pet memory`, `smart-pet permissions`, `smart-pet delegate`, `smart-pet state`, `smart-pet providers`, `smart-pet pets`, `smart-pet config`, `smart-pet version`, `smart-pet help` | Each has usage + example |
| 1.3.3 Document 21 provider env vars | OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, OLLAMA_HOST, etc. | Table with var + description |
| 1.3.4 Document base:label syntax | `ollama:llama3`, `openai:gpt-4o`, `custom:http://localhost:8080` | Examples in Provider section |

### Item 1.4 — Create ARCHITECTURE.md
**Goal**: Accurate module tree reflecting current codebase

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 1.4.1 Generate module tree | `tree -L 3 -I node_modules > /tmp/tree.txt` then curate | File matches actual `apps/`, `packages/`, `scripts/` |
| 1.4.2 Document runtime contract | RuntimeEvent v1, AgentLoop, MemoryStore, PermissionService | Each has 1-paragraph description |
| 1.4.3 Document IPC surfaces | preload ↔ main, renderer ↔ main | Table with channel + payload |

### Item 1.5 — Create PRICING.md
**Goal**: Monetization framework (free + paid tiers)

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 1.5.1 Define tiers | Free (MIT), Cloud Build $19/$49, LLM Gateway $0.001/1K, Enterprise custom | 4-tier table |
| 1.5.2 Link to Monetization.md | "See docs/Monetization.md for open-source funding model" | Cross-reference present |
| 1.5.3 Add sponsor links | GitHub Sponsors, Open Collective, Ko-fi, custom donate URL | Matches FUNDING.yml |

---

## Phase 2: Git & Release Operations (High Priority)

### Item 2.1 — Commit + Push All Changes
**Goal**: Clean commit with all pending changes on `master`

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 2.1.1 Stage all changes | `git add -A` | `git status` shows only staged files |
| 2.1.2 Create commit | `git commit -m "chore: public release hygiene v1.0.0"` | Commit hash created |
| 2.1.3 Push to origin/master | `git push origin master` | Remote updated |

### Item 2.2 — Cut v1.0.0 Tag
**Goal**: Semantic version tag with release notes

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 2.2.1 Create annotated tag | `git tag -a v1.0.0 -m "Initial public release"` | `git tag -l v1.0.0` shows tag |
| 2.2.2 Push tag | `git push origin v1.0.0` | Tag visible on GitHub |
| 2.2.3 Verify CI triggers | Watch GitHub Actions for release workflow | All publish jobs queued |

### Item 2.3 — Flip Repo to Public
**Goal**: Change visibility from private to public on GitHub

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 2.3.1 Confirm CI green | All workflows (ci, desktop-publish-*, mobile-preview) pass | Green checks on commit |
| 2.3.2 Change visibility | GitHub Settings → Danger Zone → Change visibility → Public | Repo shows "Public" badge |
| 2.3.3 Verify public clone | `git clone https://github.com/realstreetsmartnyc/smart-pet-agent.git` | Clone succeeds without auth |

### Item 2.4 — Create GitHub Release + Attach Artifacts
**Goal**: Publish v1.0.0 release with downloadable installers

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 2.4.1 Wait for CI artifacts | Linux AppImage, .deb, Windows .exe, macOS .dmg, Android .apk | All 5 artifacts in Actions artifacts |
| 2.4.2 Download artifacts | `gh release download v1.0.0 --pattern "*.AppImage" --pattern "*.deb" ...` | Local copies verified |
| 2.4.3 Create release | `gh release create v1.0.0 --title "Smart Pet Agent v1.0.0" --notes-file RELEASE_NOTES_v1.0.0.md *.AppImage *.deb *.exe *.dmg *.apk` | Release visible on GitHub with assets |
| 2.4.4 Verify downloads | Install each on target platform (VM or device) | All launch to `agent.ready` |

---

## Phase 3: Platform Verification (Medium Priority)

### Item 3.1 — Android APK Debug Verification
**Goal**: Prove Android debug APK builds and installs

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 3.1.1 Build debug APK | `cd apps/mobile && bash scripts/export-mobile-standalone.sh && cd /tmp/smart-pet-agent-mobile && npm install --legacy-peer-deps && npx expo prebuild --platform android --clean && cd android && ./gradlew assembleDebug` | `app-debug.apk` exists |
| 3.1.2 Run verifier | `bash scripts/verify-android-apk.sh` | Script exits 0 |
| 3.1.3 Install on device/emulator | `adb install -r app-debug.apk` | App launches, shows pet overlay |

### Item 3.2 — Final E2E Packaged Electron Verification
**Goal**: Ensure packaged Electron renderer has no syntax errors

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 3.2.1 Fix renderer HTML | Check `apps/electron/dist/*.html` for duplicate `electronAPI` declarations; fix to use `var electronAPI` consistently | No "Identifier already declared" in console |
| 3.2.2 Rebuild Electron | `pnpm --filter ./apps/electron run build:linux` | Build completes |
| 3.2.3 Run tightened E2E | `bash scripts/e2e-electron.sh` | Passes with renderer syntax check |

---

## Phase 4: Post-Launch Growth Setup (Low Priority — After Public)

### Item 4.1 — Social Preview Cards
**Goal**: OG/Twitter cards for repo and landing page

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 4.1.1 Create OG image | 1200x630 PNG with pet + "Smart Pet Agent" branding | File in `docs/marketing/og-image.png` |
| 4.1.2 Add meta tags | Update `apps/electron/dist/index.html` and landing page | `curl -s URL | grep og:image` |

### Item 4.2 — Star History / Analytics
**Goal**: Track adoption metrics

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 4.2.1 Submit to Star History | https://star-history.com/#realstreetsmartnyc/smart-pet-agent | Page shows graph |
| 4.2.2 Add GitHub repo topics | `smart-pet-agent`, `ai-companion`, `desktop-pet`, `electron`, `expo`, `mit-license` | Topics visible on repo |

### Item 4.3 — Product Hunt / HN / Reddit Launch
**Goal**: Public announcement

| Sub-goal | Steps | Acceptance |
|---|---|---|
| 4.3.1 Prepare launch post | Template in `docs/marketing/launch-post.md` | Post drafted |
| 4.3.2 Submit to Product Hunt | Schedule for launch day | Live on PH |
| 4.3.3 Post to HN/Reddit | r/programming, r/opensource, r/rust, r/Electron | Posts submitted |

---

## Execution Order (Sequential)

```
Week 1 (Core Release)
├── Day 1: 1.1, 1.2, 2.1
├── Day 2: 1.3, 1.4, 1.5
├── Day 3: 2.2, 2.3, 2.4 (if CI green)
├── Day 4: 3.1, 3.2
└── Day 5: Buffer / CI fixes

Week 2 (Growth)
├── 4.1, 4.2, 4.3
```

---

## Gates (Must Pass Before Next Phase)

| Gate | Command | Must Show |
|---|---|---|
| Source gates | `pnpm typecheck && pnpm test && bash scripts/smoke.sh` | All green |
| Linux E2E | `bash scripts/e2e-electron.sh` | Packaged `agent.ready` |
| Android verifier | `bash scripts/verify-android-apk.sh` | Exits 0 |
| CI green | `gh run list --limit 10` | All workflows ✅ |
| Public clone | `git clone https://github.com/realstreetsmartnyc/smart-pet-agent.git` | Succeeds |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| better-sqlite3 ABI drift on CI runners | Medium | High | `electron-builder install-app-deps` in CI; cache `.node` |
| macOS codesign fails (no cert) | High | Medium | Ship unsigned DMG with Gatekeeper warning note; cert later |
| Windows NSIS fails (missing WIN_CSC_LINK) | High | Medium | Ship unsigned NSIS; cert later |
| Expo/EAS token expires | Low | High | Rotate `EAS_TOKEN` secret before mobile builds |
| GitHub rate limits on release upload | Low | Low | Use `gh release upload` with retry |

---

## Success Metrics (v1.0.0 Launch)

| Metric | Target | Measurement |
|---|---|---|
| Stars | 1,000 in 30 days | Star History |
| Downloads | 5,000 across platforms | GitHub Release analytics |
| Paying users | 10 (Cloud Build / Gateway) | Stripe / Polar dashboard |
| Issues/PRs | 20+ community contributions | GitHub Insights |
| CI stability | 95%+ green runs | GitHub Actions |