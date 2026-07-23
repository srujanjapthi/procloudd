#!/bin/bash
# Runs tsc/eslint/prettier for both server and client, plus a client
# production build, and prints a summary. Exits non-zero if anything failed.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILED=0

check() {
  local label="$1"
  local dir="$2"
  shift 2
  echo ""
  echo "=== $label ==="
  if (cd "$dir" && "$@"); then
    echo "✓ $label passed"
  else
    echo "✗ $label FAILED"
    FAILED=1
  fi
}

echo "### Server ###"
check "server: tsc"      "$ROOT/server" npx tsc -b --noEmit
check "server: eslint"   "$ROOT/server" npx eslint .
check "server: prettier" "$ROOT/server" npx prettier --write .
check "server: test"     "$ROOT/server" npx vitest run

echo ""
echo "### Client ###"
check "client: tsc"      "$ROOT/client" npx tsc -b --noEmit
check "client: eslint"   "$ROOT/client" npx eslint .
check "client: prettier" "$ROOT/client" npx prettier --write .
check "client: build"    "$ROOT/client" npx vite build

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "✓ All checks passed."
else
  echo "✗ Some checks failed — see above."
fi
exit "$FAILED"
