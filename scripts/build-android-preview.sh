#!/bin/bash
set -euo pipefail

echo "=== Smart Pet Agent — Android Preview Build ==="
echo "This script builds an Android APK via EAS Cloud Build."
echo ""

# Check prerequisites
command -v eas >/dev/null 2>&1 || { echo "ERROR: eas-cli not found. Install: npm install -g eas-cli"; exit 1; }
if [ ! -d "apps/mobile" ]; then
  echo "ERROR: Run this from the repo root."
  exit 1
fi

cd apps/mobile

# Check login
if ! eas whoami >/dev/null 2>&1; then
  echo "Not logged in to EAS. Launching browser login..."
  eas login
fi

echo ""
echo "Starting EAS Android preview build (APK)..."
echo "This will upload your source to Expo's cloud build service."
echo ""

# Trigger build
eas build --platform android --profile preview --non-interactive

echo ""
echo "=== Build initiated ==="
echo "Monitor progress at: https://expo.dev/accounts/$(eas whoami)/projects/smart-pet-agent/builds"
echo ""
echo "When complete, download the .apk and install:"
echo "  adb install -r ~/Downloads/smart-pet-agent-preview.apk"
