#!/usr/bin/env sh
set -eu

if ! command -v node >/dev/null 2>&1; then
  echo "MiniPMDB needs Node.js 20 or newer: https://nodejs.org/" >&2
  exit 1
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec node "$script_dir/scripts/judge-demo.js" "$@"
