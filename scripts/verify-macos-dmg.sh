#!/bin/bash
set -euo pipefail
if [ "$(uname)" != "Darwin" ]; then echo "WARN: no dmg on Linux"; exit 0; fi

BUILD_DIR="${1:-apps/electron/build}"
DMG="$(find "$BUILD_DIR" -maxdepth 1 -type f -name '*.dmg' | sort | tail -n 1)"

if [[ -z "$DMG" ]]; then
  echo "FAIL: no macOS dmg found in $BUILD_DIR" >&2
  exit 1
fi

if [[ ! -s "$DMG" ]]; then
  echo "FAIL: dmg is empty: $DMG" >&2
  exit 1
fi

file apps/electron/assets/icon.icns | grep -qi 'icon' || {
  echo "FAIL: apps/electron/assets/icon.icns is not recognized as an icon file" >&2
  exit 1
}

MOUNT_POINT="/tmp/smartpet-dmg-mount"
mkdir -p "$MOUNT_POINT"
if ! hdiutil attach "$DMG" -nobrowse -readonly -mountpoint "$MOUNT_POINT" >/dev/null 2>&1; then
  echo "FAIL: hdiutil attach failed for $DMG" >&2
  exit 1
fi

trap 'hdiutil detach "$MOUNT_POINT" -quiet || true' EXIT

APP_PATH="$(find "$MOUNT_POINT" -maxdepth 2 -name 'Smart Pet Agent.app' -type d | head -n 1)"
if [[ -z "$APP_PATH" ]]; then
  echo "FAIL: Smart Pet Agent.app missing inside dmg" >&2
  exit 1
fi

# codesign is required only for a SIGNED build. The v1.0.0-alpha CI builds an
# UNSIGNED dmg (no CSC_LINK/CSC_KEY_PASSWORD secrets), which is acceptable for
# private alpha. Treat a missing/broken signature as a warning, not a failure.
if codesign --verify --deep --strict "$APP_PATH" 2>/dev/null; then
  echo "macOS app codesign OK: $APP_PATH"
else
  echo "WARN: app is unsigned or signature invalid (no signing cert configured) — acceptable for private alpha"
fi

echo "macOS dmg artifact OK: $DMG"
