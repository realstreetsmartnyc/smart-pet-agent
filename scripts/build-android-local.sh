#!/bin/bash
set -euo pipefail

echo "=== Smart Pet Agent — Android Local Build ==="
echo "This script builds an Android APK locally using Android Studio SDK."
echo ""

# Check prerequisites
if [ ! -d "apps/mobile" ]; then
  echo "ERROR: Run this from the repo root."
  exit 1
fi

cd apps/mobile

# Check Android SDK
if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  echo "ERROR: ANDROID_HOME or ANDROID_SDK_ROOT not set."
  echo "Install Android Studio and set the environment variable."
  exit 1
fi

echo "Running Expo prebuild for Android..."
pnpm prebuild

echo ""
echo "Building debug APK..."
cd android
./gradlew assembleDebug

echo ""
echo "=== Build complete ==="
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo "APK: $APK_PATH"
  echo "Install: adb install -r $APK_PATH"
else
  echo "APK not found at expected path. Check gradle output above."
fi
