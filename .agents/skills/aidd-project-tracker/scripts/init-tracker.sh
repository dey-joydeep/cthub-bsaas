#!/usr/bin/env bash
set -euo pipefail
node "$(dirname "$0")/init-tracker.mjs" "$@"
