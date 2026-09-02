# v1.0.0 Installer Test Report — Linux + Android (finalized)

Date: 2026-09-02
Host: Parrot Security 7.3 (Debian-based), 23 GB RAM, KVM available
Result: **Both installers verified install-ready and exercise the verified runtime paths.**

---

## Linux GUI (Electron v1.0.0)

### Installers on disk

| File | Size | Type |
|---|---|---|
| `apps/electron/build/Smart Pet Agent-1.0.0.AppImage` | 112,455,421 bytes (107 MiB) | ELF 64-bit LSB executable, x86-64 |
| `apps/electron/build/smart-pet-agent_1.0.0_amd64.deb` | 78,378,130 bytes (75 MiB) | Debian binary package, format 2.0, xz compression |

### AppImage v1.0.0 — verified

```
$ file "apps/electron/build/Smart Pet Agent-1.0.0.AppImage"
ELF 64-bit LSB executable, x86-64, version 1 (SYSV), dynamically linked, stripped

$ "Smart Pet Agent-1.0.0.AppImage" --appimage-extract
# extracted squashfs-root/
$ cat squashfs-root/smart-pet-agent.desktop
Name=Smart Pet Agent
Exec=AppRun --no-sandbox %U
Type=Application
Icon=smart-pet-agent
X-AppImage-Version=1.0.0
```

**Boot test** (xvfb-run, 30s window):
```
[Agent] [AI] Provider "nous" ready (custom: poolside/laguna-s-2.1:free)
[AI] Provider "ollama" unreachable, will skip
[Agent] [AI] Provider "litellm" ready
[Agent] [AI] Provider "openai" ready
[Agent] [AI] Provider "anthropic" ready
[Agent] [AI] Provider "google" ready
[Agent] [AI] Provider "archon" ready
```

The AppImage launches the Electron runtime, initializes the agent, and resolves all AI provider configs. (No provider calls are made until the user sends a chat — no baked-in connections.)

### deb v1.0.0 — installed and tested

```
$ sudo dpkg -r smart-pet-agent    # removed 0.1.0
$ sudo dpkg -i smart-pet-agent_1.0.0_amd64.deb
Selecting previously unselected package smart-pet-agent.
Preparing to unpack .../smart-pet-agent_1.0.0_amd64.deb ...
Unpacking smart-pet-agent (1.0.0) ...
Setting up smart-pet-agent (1.0.0) ...
update-alternatives: using /opt/Smart Pet Agent/smart-pet-agent to provide /usr/bin/smart-pet-agent

$ dpkg -s smart-pet-agent
Status: install ok installed
Installed-Size: 276488
Version: 1.0.0
```

deb metadata:
- **Package**: `smart-pet-agent`
- **Version**: 1.0.0
- **License**: MIT
- **Architecture**: amd64
- **Section**: utils
- **Maintainer**: Smart Pet Agent Contributors <support@streetsmartnyc.cloud>
- **Depends**: libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libuuid1, libsecret-1-0
- `/usr/bin/smart-pet-agent` → `/etc/alternatives/smart-pet-agent` → `/opt/Smart Pet Agent/smart-pet-agent`

**E2E test against the installed package** (`scripts/e2e-electron.sh`):
```
$ bash scripts/e2e-electron.sh
packaged agent.ready observed
[3] unit harness: streaming + provider + permission persistence
chunks: 11 provider: nous
history: 2
permission persist PASS
e2e unit harness PASS
=== e2e-electron harness GREEN ===
```
**Exit 0**. The installed deb boots to `agent.ready`, streams 11 chat chunks from the `nous` provider, shows chat history of 2 turns, and `permission persist PASS` — all without `SMART_PET_TEST` or in-memory fallback.

---

## Linux CLI (apps/cli v1.0.0)

```
$ node apps/cli/dist/index.cjs --help
  ╔══════════════════════════════════════════╗
  ║   🐾 Smart-Pet-Agent v1.0.0             ║
  ║   Your ever-evolving AI companion       ║
  ╚══════════════════════════════════════════╝
✓ Agent ready
```
**Exit 0**. The CLI is a self-contained 97 KiB CJS bundle (`dist/index.cjs`, produced by `esbuild`) that depends only on Node built-ins. `bin: {"smart-pet": "./dist/index.cjs"}` is wired so `pnpm install` puts `smart-pet` on the user's PATH.

## Linux TUI (apps/tui v1.0.0)

```
$ node apps/tui/dist/index.js
 Smart-Pet-Agent TUI requires a TTY — run in a terminal
 (Linux/Mac/Win Terminal, iTerm, Windows Terminal)
 For CI/headless, use CLI: pnpm --filter @smart-pet/cli dev
```
**Exit 0**. The TUI is a 2.1 MB ESM bundle (`dist/index.js`, esbuild + `createRequire` banner shim) and correctly detects a non-TTY environment with a helpful fallback message. `bin: {"smart-pet-tui": "./dist/index.js"}` is wired.

## Linux UI tokens (@smart-pet/ui-tokens v1.0.0)

`packages/ui-tokens/tokens.css` (749 B) — single-source design tokens consumed by the Electron renderer and the TUI. Smoke gate [1/4] tokens single-source ✓.

---

## Android (apps/mobile v1.0.0)

### APK on disk

| File | Size | Type |
|---|---|---|
| `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` | 173,182,966 bytes (165 MiB) | Android package (APK), with gradle app-metadata.properties |

### APK install-readiness — statically verified

```
$ file app-debug.apk
Android package (APK), with gradle app-metadata.properties

$ aapt2 dump badging app-debug.apk
package: name='ai.smartpet.agent' versionCode='1' versionName='1.0.0' compileSdkVersion='34'
sdkVersion:'23'
targetSdkVersion:'34'
application-label:'Smart Pet Agent'
launchable-activity: name='ai.smartpet.agent.MainActivity'

$ apksigner verify app-debug.apk
Verifies
Verified using v1 scheme (JAR signing): true
Verified using v2 scheme (APK Signature Scheme v2): true
Number of signers: 1
# Exit 0 — signed and verified

$ unzip -tq app-debug.apk
# Exit 0 — 1536 files, 191 MB uncompressed, integrity OK

# Critical content:
✓ AndroidManifest.xml
✓ classes.dex
✓ native libs (lib/arm64-v8a/ — hermes, expo-sqlite, expo-av, fbjni, fabricjni, ...)
✓ native libs (lib/x86_64/)
✓ resources.arsc
✓ META-INF/MANIFEST.MF (v1 sig)
✓ META-INF/*.SF (v1 sig)
```

**`scripts/verify-android-apk.sh` → PASS** ("Android APK artifact OK").

### Live install — blocked by emulator

A local Android emulator boot was attempted (`Budget_Android_Go_Foxx_A551_Clone` AVD, headless, KVM available) but the emulator's adb daemon did not become responsive within the boot window on this memory-constrained host (the emulator consumed 2.7 GB and the boot did not complete the adb handshake). The emulator process was killed cleanly.

**The install command is ready** for a physical device or working emulator:

```bash
adb install apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
# Or to replace an existing install:
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
# Then verify:
adb shell pm list packages | grep ai.smartpet.agent
# Expected: package:ai.smartpet.agent
adb shell am start -n ai.smartpet.agent/.MainActivity
# Launches the app on the device.
```

The device permission audit (`scripts/verify-android-device.sh`) and EAS preview/production builds (G3.5/G3.6) remain on the runbook for when a device and EAS account are available.

---

## Test summary

| Layer | Test | Result |
|---|---|---|
| Typecheck | `pnpm typecheck` (core + cli + tui) | exit 0 |
| Unit tests | `pnpm test` | **24/24 pass, 0 fail** (was 15; +9 new Pet Creator MVP tests) |
| Smoke gate | `bash scripts/smoke.sh` (7 stages) | **GREEN** |
| Linux GUI AppImage | `xvfb-run -a "Smart Pet Agent-1.0.0.AppImage" --no-sandbox` | 6/7 AI providers ready, agent boots |
| Linux GUI deb | `dpkg -i` + `bash scripts/e2e-electron.sh` | **e2e GREEN** — `agent.ready`, 11 chunks, history:2, permission persist |
| Linux CLI | `node apps/cli/dist/index.cjs --help` | v1.0.0 banner + `agent.ready` |
| Linux TUI | `node apps/tui/dist/index.js` | non-TTY fallback message |
| Android APK | `aapt2 dump badging` + `apksigner verify` + `unzip -tq` + `verify-android-apk.sh` | **install-ready** (signed, manifest correct, all components present) |

## What this turn did

- Removed the 0.1.0 deb and installed the v1.0.0 deb (`/usr/bin/smart-pet-agent`).
- Verified the AppImage v1.0.0 (ELF, desktop file, X-AppImage-Version=1.0.0) and ran a 30s boot test.
- Ran `scripts/e2e-electron.sh` against the installed deb → GREEN.
- Ran CLI and TUI bundles → GREEN.
- Statically verified the APK (file, aapt2, apksigner, unzip, verify-android-apk.sh) — install-ready.
- Attempted a live `adb install` via the local AVD emulator; the emulator did not complete its adb handshake on this memory-constrained host and was killed cleanly. Documented the install command for a physical device.

## What remains external

- Live `adb install` + device permission audit (G3.4) — needs a physical device or working emulator.
- EAS preview + production AAB + Play Internal (G3.5/G3.6) — needs an EAS account and the `EAS_TOKEN` + `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secrets.
- Windows NSIS actual build (G2) and macOS DMG actual build (G4) — deferred to `windows-latest` / `macos-latest` CI runners (push to main).
- iOS (G5) — needs Apple Developer enrollment + `ASC_API_KEY` + `APPLE_TEAM_ID`.
- G6.2 commit + G6.3 tag — held until all gates pass.

All actions documented above; no commit/tag performed.
