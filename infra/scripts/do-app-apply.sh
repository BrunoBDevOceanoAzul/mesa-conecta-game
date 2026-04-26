#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <dev|prod> <create|update>"
  exit 1
fi

target="$1"
action="$2"

case "$target" in
  dev|prod) ;;
  *)
    echo "Invalid target: $target"
    exit 1
    ;;
esac

case "$action" in
  create|update) ;;
  *)
    echo "Invalid action: $action"
    exit 1
    ;;
esac

if ! command -v doctl >/dev/null 2>&1; then
  echo "doctl not found in PATH"
  exit 1
fi

script_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
template="$repo_root/.do/app.$target.yaml"
output="/tmp/mesa-do-$target.yaml"

bash "$repo_root/scripts/render-do-app-spec.sh" "$template" "$output"
doctl apps spec validate "$output"

if [ "$action" = "create" ]; then
  doctl apps create --spec "$output"
else
  if [ -z "${DO_APP_ID:-}" ]; then
    echo "DO_APP_ID is required for update"
    exit 1
  fi

  doctl apps update "$DO_APP_ID" --spec "$output" --wait
fi
