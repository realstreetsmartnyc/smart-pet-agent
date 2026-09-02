# Smart Pet Agent — Android Mobile Build & Install Checklist

Status: 2026-09-01 — mobile scaffold / future beta track. This checklist is for development planning and device verification, not proof of Play Store or TestFlight readiness.

## What Exists In The Scaffold

### Core Mobile Files
- `apps/mobile/App.tsx` — Polished React Native shell with:
  - Real `MobileMemoryStore` initialization (expo-sqlite)
  - Permission request flows (camera/mic/notifications/biometrics)
  - Chat streaming simulation via `useRuntimeEvents` hook
  - Task creation + audit logging
  - History/tasks/audit panels
  - NYC Street Smart branding (ink-950, taxi-500, signal-500, tile-100)

- `apps/mobile/src/memory-mobile.ts` — Full `MobileMemoryStore` adapter:
  - Same schema as desktop `MemoryStore`
  - `expo-sqlite` async API (`openDatabaseAsync`, `runAsync`, `getFirstAsync`, `getAllAsync`)
  - Permissions, audit logs, tasks, chat history, provider configs

- `apps/mobile/src/useRuntimeEvents.ts` — React Native RuntimeEvent bridge:
  - `useRuntimeEvents()` hook mirrors Electron's `onAIChunk/onAIDone` pattern
  - Handles `chat.chunk`, `chat.done`, `chat.error`, `permission.updated`, `pet.intent`, `voice.state`, `task.list`, `audit.list`, `chat.history`

- `apps/mobile/src/permission-mobile.ts` — OS permission flows:
  - `requestCameraPermission()` → `Camera.requestCameraPermissionsAsync()`
  - `requestMicrophonePermission()` → `Audio.requestPermissionsAsync()`
  - `requestNotificationPermission()` → `Notifications.requestPermissionsAsync()`
  - `requestBiometricPermission()` → `LocalAuthentication.hasHardwareAsync()`
  - Audit parity with desktop `mobileAuditRecord`

- `apps/mobile/src/permissions.ts` — Permission mapping:
  - `MOBILE_PERMISSION_MAP` maps core devices to iOS/Android APIs
  - `mobileAuditRecord()` creates audit entries matching desktop shape

### Assets
- `apps/mobile/assets/icon.png` — 128x128 app icon
- `apps/mobile/assets/adaptive-icon.png` — 1024x1024 adaptive foreground
- `apps/mobile/assets/splash.png` — 1284x2778 splash screen

### Config
- `apps/mobile/app.json` — Expo config with:
  - Android package: `ai.smartpet.agent`
  - Permissions: CAMERA, RECORD_AUDIO, POST_NOTIFICATIONS, INTERNET, ACCESS_NETWORK_STATE, USE_BIOMETRIC, READ_MEDIA_IMAGES
  - Adaptive icon, splash, intent filters
  - Plugins: expo-build-properties, expo-camera, expo-media-library (no Firebase — user provides their own third-party credentials at runtime per the no-baked-credentials rule)

- `apps/mobile/eas.json` — EAS profiles:
  - `preview`: internal distribution, APK build type
  - `production`: app-bundle for Google Play

- `apps/mobile/package.json` — Scripts:
  - `pnpm build:android:preview` → `eas build --platform android --profile preview`
  - `pnpm build:android:production` → `eas build --platform android --profile production`
  - `pnpm build:android:local` → `cd android && ./gradlew assembleDebug`

### Build Scripts
- `scripts/build-android-preview.sh` — Automates EAS Cloud Build
- `scripts/build-android-local.sh` — Automates local Gradle build
- `scripts/verify-android-apk.sh` — Verifies the expected debug APK exists and is a plausible artifact
- `scripts/verify-android-device.sh` — Installs the APK through `adb` and probes runtime permissions on an authorized device
- `scripts/verify-eas-identity.sh` — Fails until `extra.eas.projectId` is a real Expo UUID and EAS auth is available

### Development Verification

- `bash scripts/mobile-smoke.sh` has been used as scaffold-level evidence.
- `pnpm typecheck` and `pnpm test` are source-level gates.
- `bash scripts/verify-android-apk.sh` passed locally against `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` on 2026-09-01.
- `bash scripts/verify-eas-identity.sh` currently fails by design because `apps/mobile/app.json` still contains `REPLACE_WITH_REAL_EXPO_UUID`.
- `bash scripts/verify-android-device.sh` currently cannot pass on this host because `adb devices` does not return a usable authorized device within the configured timeout.
- These checks do not replace APK/AAB device testing, Play Internal testing, iOS archive testing, or TestFlight evidence.

## Known Issue: EAS Build in pnpm Monorepo

**Symptom:** `eas build --platform android --profile preview` fails with:
```
/home/.../node_modules/.pnpm/expo@51.0.39_.../node_modules/expo/bin/cli config --json exited with non-zero code: 1
```

**Root cause:** Expo SDK 51's `config --json` command has a known issue resolving config in pnpm workspaces with nested `node_modules/.pnpm` paths.

**Workarounds (pick one):**

### Workaround A: Standalone Project (Most Reliable)
```bash
mkdir -p /tmp/smart-pet-agent-mobile && cd /tmp/smart-pet-agent-mobile
npx create-expo-app@latest . --template blank-typescript
cp -r /home/ssmartnycbase/smart-pet-agent/apps/mobile/src .
cp /home/ssmartnycbase/smart-pet-agent/apps/mobile/App.tsx .
cp /home/ssmartnycbase/smart-pet-agent/apps/mobile/app.json .
cp /home/ssmartnycbase/smart-pet-agent/apps/mobile/eas.json .
cp -r /home/ssmartnycbase/smart-pet-agent/apps/mobile/assets .
cp /home/ssmartnycbase/smart-pet-agent/apps/mobile/babel.config.js .
npm install expo@51 expo-sqlite@14 expo-camera@14 expo-notifications@0.28 expo-haptics@13 expo-local-authentication@14 expo-status-bar@1.12 expo-splash-screen@0.27 react-native-safe-area-context@4.10 react-native-screens@3.31
eas login
bash /home/ssmartnycbase/smart-pet-agent/scripts/verify-eas-identity.sh
eas build --platform android --profile preview --non-interactive
```

### Workaround B: Use npm in mobile workspace
```bash
cd apps/mobile
rm -rf node_modules package-lock.json
npm install
eas build --platform android --profile preview --non-interactive
```

### Workaround C: Local Gradle Build
```bash
cd apps/mobile
pnpm prebuild
cd android && ./gradlew assembleDebug
```

## iOS Build Prerequisites

The app already has iOS configuration in `app.json` (bundle identifier, permissions, tablet support). No native iOS project exists in the repo — EAS cloud build generates it on Expo's macOS workers.

**Before first iOS build:**
1. Fix `extra.eas.projectId` in `app.json` — replace the placeholder with a real Expo UUID
2. Resolve the pnpm/Expo SDK 51 config issue with the standalone export path if direct workspace config output is empty
3. Register an Apple Developer account ($99/year) for iOS signing
4. Add real iOS submit credentials in `apps/mobile/eas.json`
5. Run `eas build --platform ios --profile preview` from `apps/mobile/`

**iOS scripts available:**
- `pnpm build:ios:preview` — internal distribution (TestFlight / ad-hoc)
- `pnpm build:ios:production` — App Store archive

## Install on Android Device

After a verified preview APK exists, install it:

```bash
bash scripts/verify-android-device.sh /path/to/smart-pet-agent-preview.apk
```

Or if using EAS Cloud Build, download from the Expo dashboard and:
```bash
adb install -r ~/Downloads/smart-pet-agent-preview.apk
```

## Verify on Device

These are required future beta gates, not completed publish evidence:

1. Launch app → see "Smart Pet Agent" splash → "Loading mobile runtime…" → "READY"
2. Tap **Camera** → OS prompt → grant → see `camera: granted` in Permissions
3. Tap **Mic** → grant → see `microphone: granted`
4. Tap **Notify** → grant → see notification banner
5. Tap **Bio** → biometric prompt → see `biometrics: ok` in Runtime log
6. Type message → tap **Send** → see word-by-word streaming in Chat
7. Check Tasks panel → task appears with `completed` status
8. Check Audit panel → permission and chat audit entries visible
9. Close app, reopen → permissions and chat history persist (SQLite)

## Next Steps After Install

1. **Phase 2 Device Testing** (current):
   - Verify all permission flows work
   - Verify chat streaming + history persistence
   - Verify task/audit logging

2. **Phase 3: UI Polish**
   - Replace debug cards with production screens
   - Add pet orb canvas component
   - Wire real AI provider (Nous/OpenAI/etc.)

3. **Phase 4: Trust & Store**
   - Add Play Store assets
   - Internal track upload
   - iOS TestFlight parallel track

## Support

- EAS dashboard: https://expo.dev/accounts/[your-account]/projects/smart-pet-agent/builds
- Logs: `adb logcat | grep smart-pet-agent`
