#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

usage() {
  echo "Usage: $0 [-d]" >&2
  echo "  -d  run detached (default: attached)" >&2
  exit 1
}

DETACHED=false
while getopts ":d" opt; do
  case "$opt" in
    d) DETACHED=true ;;
    *) usage ;;
  esac
done

if [ "$DETACHED" = true ]; then
  docker compose up --build -d postgres rest angular
else
  docker compose up --build postgres rest angular
fi
