#!/bin/bash
set -euo pipefail

APK="${1:-apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk}"
PACKAGE_NAME="${SMART_PET_ANDROID_PACKAGE:-ai.smartpet.agent}"

if ! command -v adb >/dev/null 2>&1; then
  echo "FAIL: adb is not installed or not on PATH" >&2
  exit 1
fi

# Avoid localhost:5037 collisions: a non-adb service may be squatting the port.
# Force a unix abstract socket so the user-level adb daemon can start.
export ADB_SERVER_SOCKET="${ADB_SERVER_SOCKET:-local:5037}"

ADB_TIMEOUT="${ADB_TIMEOUT:-20}"
adb_with_timeout() {
  timeout "$ADB_TIMEOUT" adb "$@"
}

# Best-effort: start a fresh adb server so `adb devices` is fast and reliable.
# `adb start-server` itself talks to the server, so wrap it in a timeout.
set +e
adb_with_timeout start-server >/dev/null 2>&1
start_code=$?
set -e
if [[ "$start_code" -ne 0 ]]; then
  echo "WARN: adb start-server did not complete within ${ADB_TIMEOUT}s; continuing — device check may be incomplete"
fi

set +e
device_list="$(adb_with_timeout devices 2>&1)"
device_list_code=$?
set -e
if [[ "$device_list_code" -ne 0 ]]; then
  echo "WARN: adb devices did not complete within ${ADB_TIMEOUT}s — skipping install step"
  exit 0
fi

if ! printf '%s\n' "$device_list" | grep -q 'device$'; then
  echo "WARN: no Android device connected — skipping install step"
  printf '%s\n' "$device_list"
  exit 0
fi

echo "$device_list"

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
