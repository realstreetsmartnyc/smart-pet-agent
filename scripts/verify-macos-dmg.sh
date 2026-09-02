#!/bin/bash
set -euo pipefail

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

MOUNT_OUTPUT="$(hdiutil attach "$DMG" -nobrowse -readonly)"
MOUNT_POINT="$(printf '%s\n' "$MOUNT_OUTPUT" | awk '/\/Volumes\// {print $NF; exit}')"

if [[ -z "$MOUNT_POINT" || ! -d "$MOUNT_POINT" ]]; then
  echo "FAIL: could not detect mounted dmg volume" >&2
  printf '%s\n' "$MOUNT_OUTPUT" >&2
  exit 1
fi

trap 'hdiutil detach "$MOUNT_POINT" -quiet || true' EXIT

APP_PATH="$(find "$MOUNT_POINT" -maxdepth 2 -name 'Smart Pet Agent.app' -type d | head -n 1)"
if [[ -z "$APP_PATH" ]]; then
  echo "FAIL: Smart Pet Agent.app missing inside dmg" >&2
  exit 1
fi

codesign --verify --deep --strict "$APP_PATH" || {
  echo "FAIL: codesign verification failed for $APP_PATH" >&2
  exit 1
}

echo "macOS dmg artifact OK: $DMG"
echo "macOS app codesign OK: $APP_PATH"
