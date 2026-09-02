#!/bin/bash
set -euo pipefail

APK="${1:-apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk}"
METADATA="${APK%/*}/output-metadata.json"

if [[ ! -f "$APK" ]]; then
  echo "FAIL: Android APK missing: $APK" >&2
  exit 1
fi

size="$(stat -c '%s' "$APK" 2>/dev/null || wc -c < "$APK")"
if [[ "$size" -lt 10000000 ]]; then
  echo "FAIL: Android APK is unexpectedly small: $APK ($size bytes)" >&2
  exit 1
fi

if [[ -f "$METADATA" ]] && ! grep -q '"versionCode"' "$METADATA"; then
  echo "FAIL: Android output metadata is missing versionCode: $METADATA" >&2
  exit 1
fi

echo "Android APK artifact OK: $APK ($size bytes)"
