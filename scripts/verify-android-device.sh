#!/bin/bash
set -euo pipefail

APK="${1:-apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk}"
PACKAGE_NAME="${SMART_PET_ANDROID_PACKAGE:-ai.smartpet.agent}"

if ! command -v adb >/dev/null 2>&1; then
  echo "FAIL: adb is not installed or not on PATH" >&2
  exit 1
fi

ADB_TIMEOUT="${ADB_TIMEOUT:-20}"
adb_with_timeout() {
  timeout "$ADB_TIMEOUT" adb "$@"
}

set +e
device_list="$(adb_with_timeout devices -l 2>&1)"
device_list_code=$?
set -e
if [[ "$device_list_code" -ne 0 ]]; then
  echo "FAIL: adb devices did not complete within ${ADB_TIMEOUT}s or returned an error" >&2
  printf '%s\n' "$device_list" >&2
  exit 1
fi

device_count="$(printf '%s\n' "$device_list" | awk 'NR > 1 && $2 == "device" { count++ } END { print count + 0 }')"
if [[ "$device_count" -lt 1 ]]; then
  echo "FAIL: no authorized Android device or emulator is connected" >&2
  printf '%s\n' "$device_list" >&2
  exit 1
fi

bash scripts/verify-android-apk.sh "$APK"
adb_with_timeout install -r "$APK"

for permission in android.permission.CAMERA android.permission.RECORD_AUDIO android.permission.POST_NOTIFICATIONS; do
  set +e
  adb_with_timeout shell pm grant "$PACKAGE_NAME" "$permission" >/dev/null 2>&1
  grant_code=$?
  set -e
  if [[ "$grant_code" -ne 0 ]]; then
    echo "WARN: could not grant $permission through adb; manual OS prompt verification may be required"
  fi
done

adb_with_timeout shell dumpsys package "$PACKAGE_NAME" | grep -E 'android.permission.(CAMERA|RECORD_AUDIO|POST_NOTIFICATIONS)' || {
  echo "FAIL: could not verify requested runtime permissions in package dump" >&2
  exit 1
}

echo "Android device install and permission probe complete for $PACKAGE_NAME"
