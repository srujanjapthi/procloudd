#!/bin/bash
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

npx concurrently -n server,client -c blue,magenta \
  "npm run dev --prefix \"$ROOT/server\"" \
  "npm run dev --prefix \"$ROOT/client\""
