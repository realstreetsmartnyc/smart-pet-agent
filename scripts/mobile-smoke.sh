#!/bin/bash
set -e
echo "=== mobile-smoke (Sprint 4 Foundation) ==="
node --import tsx scripts/.mobile-smoke-eval.ts
echo "=== mobile-smoke GREEN ==="
