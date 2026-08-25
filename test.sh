#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

source ./docker/bootstrap.sh
ensure_submodules
ensure_env_file

trap './stop.sh' EXIT

docker compose up --build -d postgres rest angular
docker compose run --rm tests