#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:?Usage: $0 <namespace> <output-file>}"
OUTPUT="${2:?Usage: $0 <namespace> <output-file>}"
CERT="${CERT:-sealed-secrets-cert.pem}"

if [[ ! -f "$CERT" ]]; then
  echo "Certificado não encontrado: $CERT"
  echo "Execute: kubeseal --fetch-cert > sealed-secrets-cert.pem"
  exit 1
fi

: "${DATABASE_URL:?Set DATABASE_URL}"
: "${SUPABASE_URL:?Set SUPABASE_URL}"
: "${SUPABASE_ANON_KEY:?Set SUPABASE_ANON_KEY}"
: "${SUPABASE_SERVICE_ROLE_KEY:?Set SUPABASE_SERVICE_ROLE_KEY}"
: "${JWT_SECRET:?Set JWT_SECRET}"

kubectl create secret generic mesa-secrets \
  --namespace="$NAMESPACE" \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=SUPABASE_URL="$SUPABASE_URL" \
  --from-literal=SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --from-literal=JWT_SECRET="$JWT_SECRET" \
  --from-literal=CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}" \
  --dry-run=client -o yaml \
  | kubeseal --cert="$CERT" --format yaml > "$OUTPUT"

echo "Sealed secret criado: $OUTPUT"
echo "Aplique com: kubectl apply -f $OUTPUT"
