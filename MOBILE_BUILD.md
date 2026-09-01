# Smart Pet Agent — Android Mobile Build & Install Checklist

## What's Ready

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
  - Permissions: CAMERA, RECORD_AUDIO, POST_NOTIFICATIONS, READ/WRITE_EXTERNAL_STORAGE, INTERNET, ACCESS_NETWORK_STATE
  - Adaptive icon, splash, intent filters
  - Plugins: expo-sqlite, expo-camera, expo-media-library

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

### Verification
- `bash scripts/mobile-smoke.sh` → **GREEN**
- `pnpm typecheck` → **EXIT:0**
- `pnpm test` → **15 pass / 0 fail**

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
1. Fix `extra.eas.projectId` in `app.json` — replace the slug placeholder with a real Expo UUID
2. Fix import paths in `src/permission-mobile.ts`, `src/memory-mobile.ts`, `src/useRuntimeEvents.ts` — they use `../packages/` instead of `../../../packages/`
3. Resolve the pnpm/Expo SDK 51 config issue (see workarounds above)
4. Register an Apple Developer account ($99/year) for iOS signing
5. Run `eas build --platform ios --profile preview` from `apps/mobile/`

**iOS scripts available:**
- `pnpm build:ios:preview` — internal distribution (TestFlight / ad-hoc)
- `pnpm build:ios:production` — App Store archive

## Install on Android Device

After building, install the APK:

```bash
adb install -r /path/to/smart-pet-agent-preview.apk
```

Or if using EAS Cloud Build, download from the Expo dashboard and:
```bash
adb install -r ~/Downloads/smart-pet-agent-preview.apk
```

## Verify on Device

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
