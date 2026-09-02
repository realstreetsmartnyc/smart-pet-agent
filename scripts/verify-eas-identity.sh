#!/bin/bash
set -euo pipefail

APP_JSON="${1:-apps/mobile/app.json}"

if ! command -v eas >/dev/null 2>&1; then
  echo "FAIL: eas-cli is not installed or not on PATH" >&2
  exit 1
fi

project_id="$(node -e "const fs=require('fs'); const app=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); console.log(app.expo?.extra?.eas?.projectId || '')" "$APP_JSON")"
if [[ -z "$project_id" || "$project_id" == "REPLACE_WITH_REAL_EXPO_UUID" || "$project_id" == "00000000-0000-0000-0000-000000000000" ]]; then
  echo "FAIL: EAS projectId is not set to a real Expo project UUID in $APP_JSON" >&2
  exit 1
fi

if ! eas whoami >/dev/null 2>&1; then
  echo "FAIL: not logged in to EAS; run eas login or provide EAS_TOKEN in CI" >&2
  exit 1
fi

echo "EAS identity OK for projectId $project_id as $(eas whoami)"
