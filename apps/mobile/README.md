# Smart Pet Agent Mobile — Android Build & Install Guide

## Project Structure

```
apps/mobile/                      ← SOURCE OF TRUTH (git-tracked)
├── src/
│   ├── index.ts                  # MOBILE_CAPABILITIES + mobileSmoke()
│   ├── memory-mobile.ts          # expo-sqlite adapter for core MemoryStore
│   ├── permission-mobile.ts      # OS prompt flows (camera/mic/notifications/biometrics)
│   ├── permissions.ts            # Mobile permission mapping + audit parity
│   └── useRuntimeEvents.ts       # React Native bridge for RuntimeEvent v1
├── App.tsx                       # Main React Native shell
├── assets/
│   ├── icon.png                  # 128x128 app icon
│   ├── adaptive-icon.png         # 1024x1024 adaptive foreground
│   └── splash.png                # 1284x2778 splash screen
├── android/                      ← GENERATED Gradle project (committed)
├── app.json                      # Expo config
├── eas.json                      # EAS build profiles
├── package.json                  # Workspace package (pnpm)
└── tsconfig.json

scripts/
├── export-mobile-standalone.sh   ← Exports to /tmp for EAS cloud builds
├── build-android-preview.sh      ← EAS Cloud Build automation
└── build-android-local.sh        ← Local Gradle build automation
```

## Build Options

### Option A: Local Gradle Build (Fastest — Already Generated)

The `android/` directory is already generated in `apps/mobile/`. Build directly:

```bash
cd apps/mobile
cd android && ./gradlew assembleDebug
```

APK output: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`

Install:
```bash
adb install -r apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B: EAS Cloud Build (Recommended for Play Store)

EAS Cloud Build handles signing, SDK, and distribution. Use the export script:

```bash
bash scripts/export-mobile-standalone.sh
cd /tmp/smart-pet-agent-mobile
npm install --legacy-peer-deps --ignore-scripts
eas login
eas build --platform android --profile preview --non-interactive
```

Download the `.apk` from https://expo.dev/accounts/[you]/projects/smart-pet-agent/builds

### Option C: Play Store Production (AAB)

```bash
bash scripts/export-mobile-standalone.sh
cd /tmp/smart-pet-agent-mobile
npm install --legacy-peer-deps --ignore-scripts
eas login
eas build --platform android --profile production --non-interactive
```

Upload the `.aab` to Google Play Console.

### Option D: iOS EAS Cloud Build (No Mac Required)

iOS native compilation runs on Expo's macOS cloud workers. You can trigger from any machine.

```bash
cd apps/mobile
eas login
eas build --platform ios --profile preview --non-interactive
```

**Preview profile** → internal distribution (TestFlight or ad-hoc install link for physical devices).

**Production profile** → App Store-ready archive for App Store Connect upload.

Download the `.ipa` from https://expo.dev/accounts/[you]/projects/smart-pet-agent/builds

**Apple prerequisites** (required before first iOS build):
- Apple Developer account ($99/year) — needed for iOS signing
- Apple Developer credentials — EAS cloud build reads them for code signing
- Registered device UDIDs — for internal distribution to physical iPhones
- App Store Connect app record — for production builds

**Note:** You can run `eas build --platform ios` from Linux, Windows, or Android Studio machines. The native iOS compilation happens on Expo's servers. The Apple account + credentials are the only platform-specific dependency.

### Option E: iOS Local Build (Mac Required)

```bash
cd apps/mobile
npx expo prebuild --platform ios
cd ios && xcodebuild -workspace SmartPetAgent.xcworkspace -configuration Release -scheme SmartPetAgent -destination generic/platform=iOS
```

## Permissions on Android

The app requests these at runtime:
- **Camera** — for peripheral vision you approve
- **Microphone** — for voice input you approve
- **Notifications** — for ambient pet alerts
- **Biometrics** — for app unlock (optional)

Users can revoke permissions anytime in Android Settings → Apps → Smart Pet Agent → Permissions.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `eas` command not found | `npm install -g eas-cli` |
| Build fails with `ANDROID_HOME` | Install Android Studio + SDK, set `ANDROID_HOME` env |
| APK won't install | Enable "Install unknown apps" for your source (browser/Files) |
| `adb` not found | Install `android-sdk-platform-tools` or Android Studio |
| `expo prebuild` module resolution error | Use Option A (local Gradle) or Option B (EAS with export script) |

## Next Steps (v1.1.0-mobile-beta)

- Wire `expo-image` + `expo-av` for real pet orb/video
- Map `expo-haptics` + `expo-notifications` to core RuntimeEvent
- Add custom pet pack import via `expo-file-system` + `expo-media-library`
- TestFlight iOS track (parallel)
