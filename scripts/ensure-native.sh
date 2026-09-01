#!/bin/bash
set -euo pipefail
# Ensure better-sqlite3 native for current Node ABI
# Usage: bash scripts/ensure-native.sh
# Parrot host is ro /home, so tmp rebuild is used and memory.ts falls back to /tmp/better-sqlite3-build
if ! node -e "const Database=require('better-sqlite3'); const db=new Database(':memory:'); db.exec('select 1'); db.close();" >/dev/null 2>&1; then
  echo "native missing for ABI $(node -p process.versions.modules) — rebuilding to /tmp/better-sqlite3-build"
  tmpdir="$(mktemp -d /tmp/better-sqlite3-build.XXXXXX)"
  cp -r node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/. "$tmpdir"
  HOME=/tmp npx --cache /tmp/npx-cache node-gyp rebuild --directory "$tmpdir"
  mkdir -p /tmp/better-sqlite3-build/build/Release
  cp "$tmpdir/build/Release/better_sqlite3.node" /tmp/better-sqlite3-build/build/Release/better_sqlite3.node
  echo "native rebuilt: $(ls -lh /tmp/better-sqlite3-build/build/Release/better_sqlite3.node | awk '{print $9, $5}')"
else
  echo "native ok for ABI $(node -p process.versions.modules)"
fi
# Also ensure SMART_PET_TEST in-mem path for voice tests (no native needed)
echo "ensure-native done"
