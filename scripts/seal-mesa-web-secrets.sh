#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-mesa}"
NAME="${NAME:-mesa-web-secrets}"

: "${VITE_SUPABASE_URL:?Set VITE_SUPABASE_URL}"
: "${VITE_SUPABASE_PUBLISHABLE_KEY:?Set VITE_SUPABASE_PUBLISHABLE_KEY}"

kubectl -n "${NAMESPACE}" create secret generic "${NAME}" \
  --from-literal=VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
  --from-literal=VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY}" \
  --dry-run=client -o yaml \
  | kubeseal --format yaml
