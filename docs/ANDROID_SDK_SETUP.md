# Android SDK Setup (2026-09-01)

**Status:** NOT SET on Parrot Linux. Required for `expo prebuild` + `gradlew assembleDebug`.

## Current state

| Variable | Value |
|----------|-------|
| ANDROID_HOME | not set |
| ANDROID_SDK_ROOT | not set |
| sdkmanager | not found |
| adb | `/bin/adb` (present) |
| gradle | not found (need `./gradlew` from project) |
| Java | OpenJDK 25.0.4.1 |

## Setup steps (Parrot Linux)

### 1. Install Android SDK command-line tools

```bash
# Create SDK directory
mkdir -p ~/Android/Sdk
cd ~/Android/Sdk

# Download command-line tools (check latest version at https://developer.android.com/studio#command-tools)
# As of 2026: commandlinetools-linux-11076708_latest.zip
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
unzip cmdline-tools.zip
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true
# Or if the zip extracts to a versioned dir:
# mv commandlinetools-linux-*.zip cmdline-tools/latest/

# Set environment
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

### 2. Accept licenses + install required packages

```bash
# Accept all licenses
yes | sdkmanager --licenses

# Install required components for Expo SDK 51 (Android 14 / API 34 target)
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" "emulator" "system-images;android-34;google_apis;x86_64"
```

Expo SDK 51 targets Android 14 (API 34). The `google_apis` system image is for emulator; omit if only building APKs.

### 3. Create emulator (optional — only for device permission audit)

```bash
# Create AVD
avdmanager create avd -n smart-pet-agent -k "system-images;android-34;google_apis;x86_64" -d "pixel_6"

# Start emulator (requires KVM)
emulator -avd smart-pet-agent -no-window -no-boot-anim -no-snapshot-load &
```

For KVM: `sudo apt install qemu-kvm && sudo modprobe kvm && ls -l /dev/kvm`

### 4. Verify setup

```bash
sdkmanager --list 2>/dev/null | grep "platforms;android-34"
adb devices  # should show emulator or connected device
./gradlew --version  # from apps/mobile/android/
```

### 5. Environment persistence

Add to `~/.bashrc` or `~/.profile`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

## Expo prebuild requirements

For `npx expo prebuild --platform android --clean` to succeed:

- `ANDROID_HOME` set and pointing to a valid SDK
- `platforms;android-34` installed
- `build-tools;34.0.0` installed
- `platform-tools` installed (provides `adb`, `aidl`, etc.)

## Gradle build requirements

For `./gradlew assembleDebug` in `apps/mobile/android/`:

- Same Android SDK as above
- Java 17+ (OpenJDK 25 satisfies this)
- `ANDROID_HOME` set

## CI alternative (GitHub Actions)

```yaml
- name: Setup Android SDK
  uses: android-actions/setup-android@v3
  with:
    cmdline-tools-version: 11076708

- name: Accept licenses
  run: yes | sdkmanager --licenses

- name: Install Android SDK components
  run: |
    sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
```

## Underling assignment

**Assignee:** cline (infra-tactician) — install SDK on Parrot when asked
**Alternative:** Use GitHub Actions `android-actions/setup-android` for CI builds (EAS or local)

## Blockers

| Blocker | Status |
|---------|--------|
| ANDROID_HOME not set | NOT SET — need SDK install |
| sdkmanager not installed | NOT INSTALLED — need command-line tools download |
| Java version | OK — OpenJDK 25 satisfies Gradle/AGP requirements |
| KVM for emulator | NOT CHECKED — need `ls -l /dev/kvm` |

## Notes

- Expo EAS cloud builds (Phase 3.5/3.6) don't need local Android SDK — EAS provides it.
- Local `gradlew assembleDebug` (Phase 3.3) requires local SDK.
- For device permission audit (Phase 3.4), need either emulator or physical device connected via USB.
