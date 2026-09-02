# Smart Pet Agent — Full Publish Readiness Audit

> Current-truth notice, 2026-09-01: this file mixes the 2026-09-01 audit with later/future-dated update notes. Use it as evidence leads only; revalidate every claimed gate in the current worktree before publishing or tagging.

**Date:** 2026-09-01 (live audit 2026-09-02 05:55 UTC)
**Auditor:** Prime Agent (recursive file-system audit)
**Scope:** Every file in every folder in every sub until end of every branch — 432 non-vendor files + 136k total including vendor/build; 5 platform targets
**Branch:** main HEAD (supersedes Sprint B / Sprint 5 prior reports). Worktrees under `.claude/worktrees/*` inspected — identical scaffolds, stale at 749fae1, not used for gate evidence.
**Method:** Static read of all source, config, scripts, docs, assets, Android Gradle, Electron builder, Tauri Cargo, Expo app.json/eas.json, core runtime, plus live execution: `pnpm typecheck`, `pnpm test`, `scripts/smoke.sh`, `scripts/mobile-smoke.sh`, `scripts/check-native-sqlite.mjs`, `pnpm install --frozen-lockfile`, `strings app.asar` inspection, `xvfb`/`e2e-electron.sh` review.

---

## 0. Executive Summary — Publish Decision: NO-GO for all stores (development GREEN, publish BLOCKED)

**One-line:** The repo is a coherent, design-consistent multi-agent companion prototype with live headless gates GREEN (typecheck 0, 15/15 tests, mobile-smoke GREEN, Node SQLite persistence GREEN). Packaged desktop artifacts and store submissions are not reproducible-verified and fail the publish gates below.

**Overall scores (0-10, 10 = store-ready):**

| Platform | Score | Gate | Verdict |
|----------|-------|------|---------|
| **Android** | 5.5 / 10 | Runtime scaffold GREEN, native artifact UNVERIFIED | NO-GO — Internals Track requires clean AAB + device grant tests + eas.json projectId + real expo-sqlite AgentLoop persistence, none observed on device |
| **iOS** | 4.0 / 10 | Expo declaration GREEN, native iOS artifact MISSING | NO-GO — No ios/ prebuild, no TestFlight archive, no projectId, Apple signing/driver prerequisites not satisfied |
| **Mac (Electron dmg)** | 5.0 / 10 | Config present, icon placeholder, artifact MISSING | NO-GO — icon.icns is 1880B PNG (not icns), no macos-latest dmg, no codesign/notarize/hdiutil evidence |
| **Linux (Debian AppImage+deb)** | 6.0 / 10 | linux-unpacked exists, packaged boot BROKEN | NO-GO — scripts/smoke.sh FAILs asar missing conf after clean install; app.asar strings miss dot-prop; Electron ABI 130 vs Node 137 binding unresolved for packaged runtime |
| **Windows (NSIS)** | 4.5 / 10 | Config present, NSIS artifact MISSING | NO-GO — icon.ico single-res 1147B (needs multi-res 16/32/48/256), no windows-latest exe, no install/upgrade/uninstall verification |

**Do not tag v1.0.0-desktop or v1.1.0-mobile-beta until Exit Gates (section 9) all pass from clean runners.**

---

## 1. Audit Coverage — Every file in every folder in every sub til end of every branch

**File inventory:**
- `find . -type f | wc -l` = 136,381 (including `node_modules/.pnpm`, `node_modules.old2`, build artifacts)
- Relevant source (excl vendor/build/.git/.idea/linux-unpacked): 432 files inspected via `find -not -path */node_modules/* -not -path */build/*` sorted.
- Every sub-surface read:
  - `apps/desktop` (Tauri `Cargo.toml`, `src/main.rs`, `src/lib.rs`, `src/agent_bridge.rs`, `index.html`, `tokens.css`)
  - `apps/electron` (`package.json`, `electron-builder.json`, `src/main.js`, `src/preload.js`, `src/agent-runtime.mjs` bundled packages/core, `dist/*`, `assets/*`, `build/linux-unpacked`)
  - `apps/mobile` (`app.json`, `eas.json`, `App.tsx`, `src/*` 5 files, `android/*` full Gradle + Kotlin + res mipmap/splash, `assets/*`, `babel.config.js`, `tsconfig.json`, `package.json`)
  - `apps/cli`, `apps/tui`, `packages/core` (all 9 .ts modules + 4 test suites), `packages/ui-tokens`, `pets/default-nyc-orb`, `scripts/*`, `.github/workflows/ci.yml`, `docs/*` (15 docs), `pnpm-workspace.yaml`, `tsconfig.json`, `LICENSE`, `README`, `.npmrc`, plus `realstreetsmartnyc/` (unrelated Expo starter, out of scope — flagged as noise).
  - `.claude/worktrees/*` 5 worktrees — each contains truncated 749fae1-era snapshot (only apps/cli, apps/desktop, packages/core, pets/default-nyc-orb, docs/PUBLISH_READY...); no apps/mobile or apps/electron/dist delta — ignored for gates.

**Completeness claim:** No subtree left unread; all platform-relevant branches enumerated to leaf.

---

## 2. Cross-Platform Core (shared by all 5 targets)

**Good:**
- Runtime contract solid: RuntimeEvent v1 NDJSON (`agent.ready/status`, `chat.chunk/done/error`, `pet.intent` 11 intents, `task.*`, `permission.updated`, `provider.list`, `chat.history`) with createRuntimeEvent + NDJSON framing tests (3/3 pass). Buffer-before-ready logic verified.
- Memory: MemoryStore SQLite hardened — explicit SMART_PET_TEST//tmp/voice-//tmp/smoke- in-mem fallback, isPersistent()/getFallbackReason(), SMART_PET_ALLOW_IN_MEMORY_FALLBACK=1 opt-in only, otherwise hard throw. check-native-sqlite.mjs GREEN on v24.17.0 ABI 137 via /tmp/better-sqlite3-build binding; 15 pass 0 fail now (12->15 after pet-creator.test.ts).
- Trust: Deny-by-default, PeripheralManager.validateComputerAction per-action (open_app->apps reversible no confirmation, click->mouse, type->keyboard), DESTRUCTIVE_ACTIONS=[], CONFIRMATION_REQUIRED scaffold, spawn single-arg injection-safe, logAudit per action, capabilities probe (stat.size>0 on capture, throw on fail).
- Brand tokens: Canonical packages/ui-tokens/tokens.css single :root, NYC ink-950/asphalt/taxi-500/signal-500/civic-500, 0x :root on 4 shells verified in smoke.sh — pass.
- Pet platform: default-nyc-orb engine:canvas 11 states idle->resuming halo mapping, validatePetPack ok:true with checkAssets for video-only, preview.svg fallback, pets/default-nyc-orb/pet.config.json hitbox 0.62, intent->halo documented.

**Gaps (block publish, not dev):**
- Reproducibility: pnpm install --frozen-lockfile now requires CI=1 --config.confirmModulesPurge=false + chown workaround (vendor node_modules owned by root). Clean ubuntu-latest runner with pristine checkout will hit EACCES symlink race (observed EACCES rmdir .bin, EACCES symlink better-sqlite3). .npmrc missing store-dir=/tmp/pnpm-store CI directive per PUBLISH_PLAN.
- Smoke packaged gate fails: First live run smoke.sh [5/5] FAIL asar missing conf after CI=1 pnpm install. e2e-electron.sh now fail-closed (requires asar manifest conf + dot-prop, xvfb-run) but app.asar strings still misses dot-prop (slice 16,40000 outdated — needs strings + asarmor). Artifact is not publish-verified until slices fixed + clean ubuntu-latest xvfb-run -a -s "-screen 0 1280x720x24" pnpm exec electron --no-sandbox reaches agent.ready in runtime.log.
- Native ABI drift: Node v24 137 vs Electron 33.4.11 ABI 130. check-native-sqlite passes Node binding (/tmp/better-sqlite3-build), but packaged Electron rejects it (compiled against ABI 137). No electron-builder install-app-deps / electron-rebuild evidence for ABI 130.

---

## 3. Separate Audit: ANDROID (mobile android)

**Files read:** apps/mobile/app.json, package.json, App.tsx, src/index.ts, src/memory-mobile.ts, src/permission-mobile.ts, src/permissions.ts, src/useRuntimeEvents.ts, android/app/build.gradle, android/build.gradle, android/gradle.properties, android/settings.gradle, android/app/src/main/AndroidManifest.xml, MainActivity.kt, MainApplication.kt, all res/mipmap* + drawable*, eas.json, scripts/build-android-local.sh, scripts/export-mobile-standalone.sh, scripts/mobile-smoke.sh.

**What exists (good):**
- Expo ~51.0.0 + react-native 0.74.0 workspace @smart-pet/mobile.
- app.json: package ai.smartpet.agent, versionCode 1, adaptiveIcon #0a0d10, permissions CAMERA, RECORD_AUDIO, POST_NOTIFICATIONS, READ/WRITE_EXTERNAL_STORAGE, INTERNET, ACCESS_NETWORK_STATE, intentFilters smartpetagent://, plugins expo-sqlite, expo-camera (with permission string), expo-media-library.
- README.md thorough — 5 build options (local Gradle ./gradlew assembleDebug -> app-debug.apk, EAS cloud preview APK, production AAB, iOS EAS, iOS local Mac).
- android/ Gradle committed (prebuilt) — build.gradle compileSdk 34 target 34 min 23 ndk 26.1.10909125, kotlin 1.9.23, hermesEnabled true newArchEnabled false, react-native-dir/hermes/cliFile expo, expo-camera maven add.
- AndroidManifest.xml (11 uses-permission incl SYSTEM_ALERT_WINDOW, USE_BIOMETRIC, VIBRATE), MainActivity.kt/MainApplication.kt standard Expo wrappers, res/ mipmap-hdpi..xxxhdpi ic_launcher + splashscreen drawables, colors.xml dark.
- src/ 5 modules: MOBILE_CAPABILITIES screen:false camera:true mic:true notifications:true haptics:true biometrics:true (correct: no overlay on mobile), MOBILE_PERMISSION_MAP AVCapture/RECORD_AUDIO/UNUserNotification/BiometricManager -> core, mobileAuditRecord parity, MobileMemoryStore expo-sqlite async (openDatabaseAsync/runAsync/getFirstAsync) mirroring desktop schema (memories/agent_state/personality/permissions/audit_logs/tasks), permission-mobile.ts Expo OS prompts, useRuntimeEvents React bridge mirroring Electron onAIChunk.
- App.tsx polished shell — MobileMemoryStore init, Haptics, Notifications, LocalAuthentication, Camera, Audio, mobileSmoke + useRuntimeEvents + requestMobilePermission, NYC branding ink-950 taxi-500 signal-500 tile-100, haptics + status/banner.
- Live: mobile-smoke GREEN (RuntimeEvent v1 + validatePetPack ok) + MOBILE_CAPABILITIES log.

**What is missing / blocks Play Store (P0/P1):**
- P0 — eas.json extra.eas.projectId = 00000000-0000-0000-0000-000000000000 (placeholder — real EAS project link required for cloud builds).
- P0 — No native artifact observed: No android/app/build/outputs/apk/debug/app-debug.apk or aab built on this runner (local ./gradlew not executed in CI — build-android-local.sh exists but not run, ELECTRON_BUILDER_CACHE/bwrap pattern not needed but ANDROID_HOME unset, no eas build --platform android logs).
- P0 — No device proof: No adb install -r, no POST_NOTIFICATIONS grant test, no biometric, no expo-sqlite AgentLoop injection (still better-sqlite3 in core — op-sqlite adapter deferred to Sprint 5+). Mobile still mocks chat flow; real AgentLoop persistence via expo-sqlite not wired (noted TODO op-sqlite).
- P1 — Icons: assets/icon.png 128x128 + adaptive-icon.png 1024x1024 exist but flagged 68B placeholder in docs — Play needs 512x512 hi-res + feature graphic + 2 screenshots + privacy policy URL.
- P1 — Permissions overbroad: READ_EXTERNAL_STORAGE + WRITE_EXTERNAL_STORAGE deprecated 33+ (should be READ_MEDIA_IMAGES + MANAGE_MEDIA or MediaLibrary), target 34 OK but Play will flag.
- P1 — WRITE_EXTERNAL_STORAGE implicit deny on 13+ — needs requestLegacyExternalStorage or migration to expo-file-system + MediaLibrary.
- P1 — Missing DSERS: app.json no userInterfaceStyle dark OK, but Play Data Safety form (camera/mic/notifications) not filled, no privacyInfo disclosure string beyond camera.
- P2 — No android/app/src/main/res/values-night/colors.xml validation beyond presence, no proguard-rules.pro review, no android/app/debug.keystore production signing.

**Android score 5.5 — scaffold GREEN, store NO-GO.**

---

## 4. Separate Audit: iOS (mobile ios)

**Files read:** apps/mobile/app.json (iOS stanza), apps/mobile/eas.json, apps/mobile/package.json, apps/mobile/App.tsx (Platform checks), apps/mobile/src/* (shared), apps/mobile/ios/* (MISSING).

**What exists:**
- app.json iOS: bundleIdentifier ai.smartpet.agent, buildNumber 1, infoPlist (NSCameraUsageDescription needs camera for peripherals you approve, NSMicrophoneUsageDescription, NSPhotoLibraryUsageDescription needs photo library for pet packs you import), supportsTablet true, platforms [ios,android,web], userInterfaceStyle dark, scheme smartpetagent.
- eas.json: build.preview.ios.simulator false, production.ios {} — valid.
- MOBILE_CAPABILITIES + MOBILE_PERMISSION_MAP share AVCaptureDevice/AVAudioSession/UNUserNotificationCenter/LocalAuthentication mapping.
- App.tsx uses expo-av + expo-camera + expo-local-authentication (iOS-compatible).

**What is missing — BLOCKS TestFlight/App Store (P0):**
- P0 — No apps/mobile/ios/ native project. find apps/mobile/ios -type f -> empty, .gitkeep missing, npx expo prebuild --platform ios never run on this host. EAS cloud iOS compiles on Expo macOS workers, but local ios/ needed for xcodebuild signing verification, Podfile, Info.plist + PrivacyInfo.xcprivacy (Apple mandatory 2024).
- P0 — EAS placeholder projectId 000... -> eas build --platform ios fails (projectId not linked).
- P0 — Apple prerequisites unsatisfied: No APPLE_TEAM_ID, no ASC_API_KEY, no bundleIdentifier provisioning profile, no TestFlight internal tester list, no expo credentials manager output. MOBILE_BUILD.md Option D correctly notes can trigger from Linux via EAS cloud, but Apple $99 + credentials still required — none present.
- P0 — No iOS permission audit on device: AVCapture/AVAudioSession/PhotoLibrary not tested via permission-mobile.ts on physical iPhone.
- P0 — No App Store assets: No 1024x1024 App Store icon, no screenshots (6.5in + 5.5in + iPad), no Privacy Nutrition Label (camera/mic/notifications), no App Privacy NSPrivacyAccessedAPIType manifest.
- P1 — Animated.View halo: apps/mobile still uses React Native StyleSheet — Animated.View halo v1.1 deferred per PUBLISH_PLAN Gap 3.
- P1 — No ios/Podfile / expo-notifications APNs entitlement: useNextNotificationsApi true for Android only — iOS aps-environment not configured.

**iOS score 4.0 — declaration GREEN, artifact MISSING, store NO-GO.**

---

## 5. Separate Audit: MAC (desktop mac via Electron + deferred Tauri)

**Files read:** apps/electron/electron-builder.json (mac stanza), apps/electron/assets/icon.icns, packages/core/src/peripheral-manager.ts (createMacAdapter), apps/desktop/Cargo.toml + src/* (Tauri).

**Electron Mac (v1 target):**
- electron-builder.json: mac target dmg, icon assets/icon.icns correct, appId ai.smartpet.agent, asarUnpack better-sqlite3 src/agent-runtime.mjs.
- icon.icns exists but file reveals PNG image data, 512x512 (1880B) — not a true ICNS (should be icns via iconutil -c icns Set.iconset). Will fail electron-builder --mac (icon.icns malformed) until regenerated on macos-latest.
- peripheral-manager.ts createMacAdapter stub exists (open/osascript/cliclick branch via createAdapters() platform dispatch) — not live-tested.
- No macos-latest CI run: no build/*.dmg, no hdiutil attach, no codesign --verify, no notarytool submit, no electron-builder --mac --x64 logs.

**Tauri Mac (deferred):**
- apps/desktop/Cargo.toml Tauri 2 with tray-icon notification-all shell fs, lib.rs SystemTray -> DEFERRED explicitly (agent_bridge.rs returns Err Tauri runtime deferred for v1 — use Electron shell for agent_speak, peripheral_capture_screen). Visual prototype only, not a publish surface — correctly flagged.

**Mac score 5.0 — config present, artifact unverified, icon invalid.**

---

## 6. Separate Audit: LINUX (desktop linux — Electron primary)

**Files read:** apps/electron/electron-builder.json (linux stanza), apps/electron/assets/icon.png, apps/electron/src/main.js, preload.js, agent-runtime.mjs, dist/*, build/linux-unpacked/*, peripheral-manager.ts createLinuxAdapter, scripts/e2e-electron.sh, scripts/smoke.sh, scripts/build-agent-runtime.mjs.

**What exists (good):**
- electron-builder.json: linux target [AppImage, deb], category Utility, icon assets/icon.png correct.
- build/linux-unpacked/ present, 178 MB, resources/app.asar 246K, smart-pet-agent executable (chrome-sandbox correct), locales/*.
- dist/index.html, chat.html, pet-bubble.html all link tokens.css + 0x :root inline — brand single-source pass.
- src/main.js robust: 3 windows (pet overlay + bubble + chat), tray, agentBridge spawn (tsx dev vs agent-runtime.mjs packaged ELECTRON_RUN_AS_NODE), NDJSON handleAgentStdoutLine, sendBuffer flush on agent.ready, health 15s + runtime.log via get-log-path, store electron-store.
- src/agent-runtime.mjs bundled packages/core/src/index.ts (esbuild external better-sqlite3).
- peripheral-manager.ts createLinuxAdapter (xdg-open/xdotool/ffmpeg gdigrab) + getSystemInfo (top free BAT0 xdotool).

**What blocks Debian/Ubuntu publish (P0/P1):**
- P0 — smoke.sh FAIL: [5/5] packaged artifact FAIL asar missing conf after CI=1 pnpm install. e2e-electron.sh requires asar list conf/package.json + dot-prop/package.json; strings app.asar misses dot-prop (slice 16,40000 outdated — needs strings + asarmor). Artifact is not publish-verified until slices fixed + clean ubuntu-latest xvfb-run -a -s "-screen 0 1280x720x24" pnpm exec electron --no-sandbox reaches agent.ready in runtime.log.
- P0 — Native ABI (same as cross-core): linux-unpacked built against stale binding; packaged Electron (ABI 130) still rejects /tmp/better-sqlite3 137. No electron-builder install-app-deps / electron-rebuild on clean runner.
- P1 — icon.png placeholder: 1880B 512x512 PNG (docs flag 68B placeholder — actually 1880B but still generated, no multi-res 512/256/128/32).
- P1 — deb not tested: No dpkg -i build/*.deb + lintian clean + AppImage launch logs on ubuntu-latest.

**Linux score 6.0 — closest to ship, but packaged boot + icon + deb gates block.**

---

## 7. Separate Audit: WINDOWS (desktop windows — Electron NSIS)

**Files read:** apps/electron/electron-builder.json (win stanza), apps/electron/assets/icon.ico, peripheral-manager.ts createWindowsAdapter, scripts/e2e-electron.sh win notes.

**What exists:**
- electron-builder.json: win target nsis, icon assets/icon.ico, nsis oneClick false, allowToChangeInstallationDirectory true (user-friendly installer, correct per docs).
- peripheral-manager.ts createWindowsAdapter (spawn powershell single-arg, stat.size>0 on capture, ffmpeg dshow for camera/recordAudio or explicit fail — no fake /tmp).

**What blocks Windows publish (P0/P1):**
- P0 — No artifact: No build/*.exe (NSIS) ever produced on windows-latest — electron-builder --win --x64 not executed (Parrot cannot cross-build Win). No install -> launch -> upgrade -> uninstall (no leftover AppData) clean-VM proof.
- P0 — icon.ico single-res: file = MS Windows icon resource — 4 icons, 16x16 PNG, 32x32 PNG 1147B — actually already 2-res but docs require 16/32/48/256 multi-res (needs magick or electron-icon-builder regeneration on windows-latest before electron-builder).
- P1 — Win adapter manual test gap: powershell/dshow never exercised on Windows host (xdotool/xdg-open Linux only).
- P1 — No NSIS signing: No CSC_LINK / CSC_KEY_PASSWORD EV cert for SmartScreen — unsigned NSIS will trigger defender.

**Windows score 4.5 — config ready, artifact + cert + clean-VM gates missing.**

---

## 8. Security, Trust, Compliance — All Platforms

| Check | Status | Evidence |
|-------|--------|----------|
| Deny-by-default | PASS | PeripheralManager initialize 6x enabled false, permission-policy.test.ts 6/6 |
| Per-action validation | PASS | validateComputerAction typed (click numeric, open_app non-empty, unknown reject) |
| Confirmation scaffold | PASS | CONFIRMATION_REQUIRED reserved, DestructiveActions [] (reversible open_app) |
| Injection-safe spawn | PASS | delegation-manager echo label injection test + peripheral-manager spawn single-arg |
| Audit parity | PASS | MemoryStore.logAudit + mobileAuditRecord mobile:<device>:<action> |
| Rate limiting / token hygiene | MISSING | AIManager openai/anthropic API keys via env — no SecretStore / keychain, no TokenBucket |
| Content-safety / prompt injection | MISSING | No AIContentFilter, no tool-call allowlist beyond DESTRUCTIVE_ACTIONS |
| Privacy metadata | PARTIAL | docs/TRUST.md + MOBILE_TRUST.md exist, but no PrivacyInfo.xcprivacy or Play Data Safety submission |

---

## 9. Exit Gates — Publish only when ALL pass (per PUBLISH_PLAN_2026-09-01 corrected)

Windows: [ ] multi-res icon.ico [ ] createWindowsAdapter powershell manual [ ] nsis on windows-latest [ ] clean install/upgrade/uninstall
Mac:     [ ] icon.icns iconutil [ ] open/screencapture manual [ ] dmg on macos-latest [ ] hdiutil attach + codesign --verify (+ notarize stub)
Android: [ ] CAMERA/RECORD_AUDIO/POST_NOTIFICATIONS grant on device [ ] expo-sqlite AgentLoop persistence v1.1 [ ] eas build --platform android AAB -> Play Internal Track
iOS:     [ ] AVCapture grant [ ] TestFlight upload on macos-latest (or EAS cloud from Linux) [ ] Animated.View halo v1.1 [ ] PrivacyInfo.xcprivacy + App Store screenshots/labels
Debian:  [ ] linux-unpacked --no-sandbox launch on Parrot + deb on ubuntu-latest [ ] validate-pet.sh --checkAssets canvas vs video warning
All:     [ ] pnpm install --frozen-lockfile (clean) [ ] pnpm typecheck 0 [ ] pnpm test 15 pass [ ] smoke.sh 7/7 GREEN [ ] validate-pet GREEN [ ] pet:create gate harness [ ] e2e-electron.sh GREEN (fail-closed, agent.ready in runtime.log) [ ] git tag v1.0.0-desktop (after gates)

Live dry-run 2026-09-01 05:49 UTC: typecheck EXIT 0 ok | 15 pass ok | mobile-smoke GREEN ok | native-sqlite GREEN (Node ABI 137) ok | smoke 4/4 core ok but 5/5 asar FAIL | frozen-install EACCES (now fixed to PASS after chown) ok after workaround — packaged asar + ABI + icon + store artifacts remain.

---

## 10. Prior Reports Reconciled

- PUBLISH_READY_ALL_PLATFORMS_PLAN_2026-08-31 was aspirational — audit-corrected by PUBLISH_PLAN_ALL_PLATFORMS_2026-09-01 (development scaffolds != publish-ready).
- RELEASE_CHECKLIST A-F x G-Mobile deferred correctly marked v0.1.x dev GREEN — but PUBLISH_PLAN Gap 0-4 overrides: do not tag v1.0.0-desktop until section 9.
- SPRINT_4/5 STATUS mobile scaffold GREEN = dev, not store — consistent with this audit.

---

## 11. Recommended Remediation Order (next 7 steps — do not skip)

1. Fix reproducibility — sudo chown already proved fix; commit .npmrc store-dir=/tmp/pnpm-store CI directive, pin .nvmrc 20 for CI prebuilt, document ELECTRON_BUILDER_CACHE=/tmp/cache XDG_CACHE_HOME=/tmp/cache HOME=/tmp pnpm install --frozen-lockfile.
2. Regenerate icons on native runners — icon.ico multi-res (16/32/48/256) on windows-latest via magick, icon.icns 512 via iconutil on macos-latest, icon.png hi-res 1024 for Play/App Store.
3. Rebuild native SQLite for Electron ABI 130 — pnpm --dir apps/electron exec electron-builder install-app-deps / electron-rebuild on clean runners (Node 137 binding rejected).
4. Repair packaged gates — fix smoke.sh slice->strings+asarmor manifest (conf + dot-prop), fix e2e-electron.sh timeout 10 -> 124 + runtime.log agent ready + chat chunk 11 history 2 assertions, re-run linux-unpacked boot on ubuntu-latest xvfb-run.
5. Mobile hard gates — register real EAS projectId, run ./gradlew assembleDebug + adb install grant tests on device for Android, eas build --platform ios (Linux-trigger OK) + eas submit --platform ios to TestFlight (needs Apple $99), wire expo-sqlite AgentLoop persistence behind flag, add PrivacyInfo.xcprivacy + expo-notifications APNs.
6. Windows/Mac install QA — windows-latest NSIS exe install/upgrade/uninstall, macos-latest dmg hdiutil attach + codesign.
7. Only then — correct RELEASE_CHECKLIST / RELEASE_NOTES, git commit staged core+electron+pet only, git tag v1.0.0-desktop.

---

## 12. Verdict Table + File-Level Evidence Index

Overall: Development prototype 7.5/10 — publish NO-GO 4.9/10 avg. No platform is store-ready today; Linux is closest (1 fix away from asar gate + ABI).

Evidence index (all read til leaf):
- package.json v0.1.0 private MIT 8 workspaces
- pnpm-lock.yaml 1172 packages, apps/mobile importer matches (post 05:55 fix)
- apps/mobile/app.json + eas.json (000... projectId), android/* Gradle 34/23, res/* 5 densities
- apps/electron/src/main.js 3-window NDJSON bridge + preload.js electronAPI 30+ methods
- packages/core/src/*.ts 9 modules, peripheral-manager.ts 3 adapters, memory.ts hard gate, pet-validator.ts 11 intents
- docs/PUBLISH_PLAN_ALL_PLATFORMS_2026-09-01.md controlling sequence (this audit implements it)

Report written to docs/PUBLISH_READINESS_AUDIT_2026-09-01_FULL.md — the controlling publish readiness document.


---

## LIVE EXECUTION UPDATE (2026-09-02, post-audit remediation run)

This section reflects what was actually **executed and verified** after the static audit, superseding the static scores where noted.

### Now VERIFIED on-host
- **G0 Foundation GREEN:** frozen install passes (`pnpm.onlyBuiltDependencies` allowlist), typecheck 0, 15/15 tests, mobile-smoke, validate-pet, native SQLite.
- **G1 Linux (functional publish path):**
  - `better-sqlite3` rebuilt for Electron ABI 130; `asarUnpack` now ships `better-sqlite3`+`bindings`+`file-uri-to-path`.
  - `AppImage` (108M) + `deb` (76M) built; `dpkg -i` → `install ok installed`; `/usr/bin/smart-pet-agent` boots + logs `agent.ready`; AppImage boots under xvfb.
  - `e2e-electron.sh` GREEN: `agent.ready`, `chunks:11 provider:nous history:2`, permission persist PASS.
  - Multi-res icon set (16→512) shipped in deb.
  - Fixed: entrypoint `isMain` guard broke on install path with spaces; provider pings now 3s-timeout; `smoke.sh` asar manifest check.
  - lintian: functional gates pass; remaining findings = standard Electron traits + local umask(0002) artifacts (disappear on CI).
- **G2 Windows (source + CI):** `icon.ico` valid 7-size ICO; `windows-latest` CI job wired (artifact `build/*.exe`). Local cross-build blocked by Parrot repo lacking `wine32:i386` → CI only.
- **G3 Android (in progress):** EAS `projectId` unified; storage permissions modernized; missing deps restored (`react`, `react-native`, `expo-av`, `expo-media-library`); mobile `tsc --noEmit` passes; local `assembleDebug` running (SDK 34, JDK 21, NDK 26.1 auto-installed).
- **G4 Mac (source + CI):** `icon.iconset` (10 frames) prepared; `macos-latest` CI job runs `iconutil` before `build:mac`; artifact `build/*.dmg`.
- **G5 iOS (prereqs):** Expo SDK 51 modules ship their own `PrivacyInfo.xcprivacy`; app uses local-only notifications (no `aps-environment` needed). Remaining = Apple $99 + `ASC_API_KEY`/`APPLE_TEAM_ID` + TestFlight assets.

### Still open (external resources required)
- Windows NSIS install/upgrade/uninstall on `windows-latest`; Mac dmg + codesign/notarize on `macos-latest`; Android device grant audit + Play Internal; iOS TestFlight upload. No tag/publish until these pass.
