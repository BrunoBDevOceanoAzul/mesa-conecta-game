#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-mesa}"
NAME="${NAME:-mesa-web-secrets}"

: "${NEXT_PUBLIC_SUPABASE_URL:?Set NEXT_PUBLIC_SUPABASE_URL}"
: "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:?Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"

kubectl -n "${NAMESPACE}" create secret generic "${NAME}" \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --from-literal=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" \
  --dry-run=client -o yaml \
  | kubeseal --format yaml
