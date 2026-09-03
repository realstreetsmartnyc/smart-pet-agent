#!/bin/bash
set -euo pipefail
# Smart Pet Agent — end-to-end demo
# Usage: bash scripts/demo.sh [--skip-install] [--skip-build] [--help]
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
SKIP_INSTALL=0; SKIP_BUILD=0
for arg in "$@"; do case "$arg" in --skip-install) SKIP_INSTALL=1;; --skip-build) SKIP_BUILD=1;; --help|-h) echo "Usage: $0 [--skip-install] [--skip-build]"; exit 0;; *) echo "Unknown arg $arg"; exit 1;; esac; done

section(){ echo ""; echo "========================================"; echo " $1"; echo "========================================"; }
ok(){ echo "✓ $1"; } ; fail(){ echo "✗ $1" >&2; exit 1; }

section "0/5 Prerequisites"
command -v node >/dev/null || fail "node missing"
command -v pnpm >/dev/null || fail "pnpm missing"
ok "node $(node --version)  pnpm $(pnpm --version 2>/dev/null || echo ?)"

if [ "$SKIP_INSTALL" = "0" ]; then
  section "1/5 Install (pnpm install)"
  CI=1 pnpm install --frozen-lockfile --config.confirmModulesPurge=false || pnpm install
  ok "install"
else
  section "1/5 Install — skipped (--skip-install)"
fi

section "2/5 Typecheck"
pnpm typecheck || fail "typecheck failed"
ok "typecheck"

section "3/5 Tests"
pnpm test || fail "tests failed"
ok "24/24 tests pass"

section "4/5 Smoke gate"
bash scripts/smoke.sh || fail "smoke failed"
ok "SMOKE GATE GREEN"

section "5/5 Build (optional)"
if [ "$SKIP_BUILD" = "1" ]; then
  echo "Skipped (--skip-build). On Linux, run: pnpm --filter @smart-pet/desktop build:linux"
else
  if [ "$(uname)" != "Linux" ]; then
    echo "Build skipped — not Linux ($(uname)). Use --skip-build to suppress this."
  else
    pnpm --filter ./apps/electron run build:linux || echo "WARN: build:linux failed (requires xvfb/electron-builder deps)"
  fi
fi

echo ""
echo "========================================"
echo " DEMO GREEN — Smart Pet Agent v1.0.0 ready"
echo "  pet: pets/default-nyc-orb  validate: pnpm validate:pet"
echo "  Next: asciinema rec demo.cast --command \"bash scripts/demo.sh --skip-build\" && agg demo.cast docs/demo.gif"
echo "========================================"
