#!/usr/bin/env bash
set -euo pipefail

project_ref="${SUPABASE_PROJECT_REF:-xqjiizwtfavpvxytqzvv}"
api_base_url="${CUSTOMERIO_API_BASE_URL:-https://api.customer.io/v1}"

required_vars=(
  CUSTOMERIO_APP_API_KEY
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: ${var_name}" >&2
    exit 1
  fi
done

if [[ -z "${CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID:-}" && -z "${CUSTOMERIO_TRANSACTIONAL_MESSAGE_IDS:-}" && "${CUSTOMERIO_ALLOW_UNCATEGORIZED:-}" != "true" ]]; then
  echo "Missing CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID or CUSTOMERIO_TRANSACTIONAL_MESSAGE_IDS" >&2
  echo "Set CUSTOMERIO_ALLOW_UNCATEGORIZED=true only if you intentionally want uncategorized sends." >&2
  exit 1
fi

secrets=(
  "CUSTOMERIO_APP_API_KEY=${CUSTOMERIO_APP_API_KEY}"
  "CUSTOMERIO_API_BASE_URL=${api_base_url}"
)

if [[ -n "${CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID:-}" ]]; then
  secrets+=("CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID=${CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID}")
fi

if [[ -n "${CUSTOMERIO_TRANSACTIONAL_MESSAGE_IDS:-}" ]]; then
  secrets+=("CUSTOMERIO_TRANSACTIONAL_MESSAGE_IDS=${CUSTOMERIO_TRANSACTIONAL_MESSAGE_IDS}")
fi

if [[ -n "${CUSTOMERIO_ALLOW_UNCATEGORIZED:-}" ]]; then
  secrets+=("CUSTOMERIO_ALLOW_UNCATEGORIZED=${CUSTOMERIO_ALLOW_UNCATEGORIZED}")
fi

if [[ -n "${CUSTOMERIO_CDP_WRITE_KEY:-}" ]]; then
  secrets+=("CUSTOMERIO_CDP_WRITE_KEY=${CUSTOMERIO_CDP_WRITE_KEY}")
fi

if [[ -n "${CUSTOMERIO_EVENTS_WRITE_KEY:-}" ]]; then
  secrets+=("CUSTOMERIO_EVENTS_WRITE_KEY=${CUSTOMERIO_EVENTS_WRITE_KEY}")
fi

if [[ -n "${CUSTOMERIO_CDP_API_BASE_URL:-}" ]]; then
  secrets+=("CUSTOMERIO_CDP_API_BASE_URL=${CUSTOMERIO_CDP_API_BASE_URL}")
fi

supabase secrets set --project-ref "${project_ref}" "${secrets[@]}"

echo "Customer.io email secrets configured for Supabase project ${project_ref}"
