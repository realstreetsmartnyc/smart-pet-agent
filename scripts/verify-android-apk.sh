#!/bin/bash
set -euo pipefail

# verify-android-apk.sh
# Deep verification of a built Android APK artifact.
#
# Usage: scripts/verify-android-apk.sh [path/to/app.apk]
# Default path: apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
#
# Checks (all must pass):
#   1. File exists and is a non-trivial size (>= 10 MB).
#   2. aapt2 dump badging succeeds and the package name is "ai.smartpet.agent".
#   3. sdkVersion / targetSdkVersion are reported.
#   4. uses-permission for android.permission.CAMERA is declared.
#   5. APK contains a META-INF signature entry (CERT.RSA / *.SF / MANIFEST.MF).
#   6. output-metadata.json (if present) declares versionCode.
#
# Tooling fallback:
#   - If `aapt2` is missing, fall back to legacy `aapt`.
#   - If neither is available, the manifest/SDK/permission checks are skipped
#     with a WARN; size, metadata and signature checks still run.

APK="${1:-apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk}"
METADATA="${APK%/*}/output-metadata.json"
EXPECTED_PACKAGE="ai.smartpet.agent"

# ---------------------------------------------------------------------------
# 1. Existence + size
# ---------------------------------------------------------------------------
if [[ ! -f "$APK" ]]; then
  echo "FAIL: Android APK missing: $APK" >&2
  exit 1
fi

size="$(stat -c '%s' "$APK" 2>/dev/null || wc -c < "$APK")"
if [[ "$size" -lt 10000000 ]]; then
  echo "FAIL: Android APK is unexpectedly small: $APK ($size bytes)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 2-4. aapt2 manifest checks (package name, SDK, CAMERA permission)
# ---------------------------------------------------------------------------
AAPT_BIN=""
if command -v aapt2 >/dev/null 2>&1; then
  AAPT_BIN="aapt2"
elif command -v aapt >/dev/null 2>&1; then
  AAPT_BIN="aapt"
  echo "WARN: aapt2 not found, falling back to legacy 'aapt' for manifest inspection" >&2
else
  echo "WARN: neither aapt2 nor aapt is installed; skipping manifest + SDK + permission deep checks" >&2
fi

if [[ -n "$AAPT_BIN" ]]; then
  badging="$("$AAPT_BIN" dump badging "$APK" 2>/dev/null || true)"
  if [[ -z "$badging" ]]; then
    echo "FAIL: $AAPT_BIN dump badging produced no output for $APK" >&2
    exit 1
  fi

  # 2. package name must match expected package
  pkg_line="$(printf '%s\n' "$badging" | grep -E "^package: name=\\('?[^ ]+'?\\) versionCode=" | head -1 || true)"
  if [[ -z "$pkg_line" ]]; then
    # Fallback pattern for legacy aapt output (no parens around package name)
    pkg_line="$(printf '%s\n' "$badging" | grep -E "^package: name='[^']+' versionCode=" | head -1 || true)"
  fi
  if [[ -z "$pkg_line" ]]; then
    echo "FAIL: could not locate package line in $AAPT_BIN dump badging output" >&2
    exit 1
  fi
  if ! grep -qE "name='${EXPECTED_PACKAGE}'" <<<"$pkg_line"; then
    echo "FAIL: APK package name is not '${EXPECTED_PACKAGE}': $pkg_line" >&2
    exit 1
  fi
  echo "OK: package name matches ${EXPECTED_PACKAGE}"

  # 3. SDK versions reported
  sdk_report="$(printf '%s\n' "$badging" | grep -E "sdkVersion|targetSdkVersion" || true)"
  if [[ -z "$sdk_report" ]]; then
    echo "FAIL: $AAPT_BIN dump badging did not report sdkVersion / targetSdkVersion" >&2
    exit 1
  fi
  echo "OK: SDK info:"
  printf '   %s\n' $sdk_report

  # 4. CAMERA permission declared
  if ! printf '%s\n' "$badging" | grep -Eq 'uses-permission.*CAMERA'; then
    echo "FAIL: APK does not declare android.permission.CAMERA" >&2
    exit 1
  fi
  echo "OK: CAMERA permission declared"
fi

# ---------------------------------------------------------------------------
# 5. Signature (META-INF)
# ---------------------------------------------------------------------------
if ! unzip -l "$APK" | grep -q META-INF; then
  echo "FAIL: APK is missing META-INF signature entry (unsigned or corrupt)" >&2
  exit 1
fi
sig_entries="$(unzip -l "$APK" | awk '/META-INF/ {print $NF}' | sort -u | tr '\n' ' ')"
echo "OK: APK is signed (META-INF entries: ${sig_entries})"

# ---------------------------------------------------------------------------
# 6. output-metadata.json (when present)
# ---------------------------------------------------------------------------
if [[ -f "$METADATA" ]] && ! grep -q '"versionCode"' "$METADATA"; then
  echo "FAIL: Android output metadata is missing versionCode: $METADATA" >&2
  exit 1
fi

echo "Android APK artifact OK: $APK ($size bytes)"
