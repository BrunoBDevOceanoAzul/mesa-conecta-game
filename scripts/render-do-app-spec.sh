#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <template> <output>"
  exit 1
fi

template="$1"
output="$2"

required_vars=(
  APP_NAME
  APP_BRANCH
  APP_ENV
  APP_REGION
  NODE_ENV_VALUE
  VITE_APP_URL
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  DATABASE_URL
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  JWT_SECRET
)

for var_name in "${required_vars[@]}"; do
  if [ -z "${!var_name:-}" ]; then
    echo "Missing required env var: $var_name"
    exit 1
  fi
done

mkdir -p "$(dirname "$output")"
cp "$template" "$output"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

sed -i.bak \
  -e "s/__APP_NAME__/$(escape_sed "$APP_NAME")/g" \
  -e "s/__APP_BRANCH__/$(escape_sed "$APP_BRANCH")/g" \
  -e "s/__APP_ENV__/$(escape_sed "$APP_ENV")/g" \
  -e "s/__APP_REGION__/$(escape_sed "$APP_REGION")/g" \
  -e "s/__NODE_ENV_VALUE__/$(escape_sed "$NODE_ENV_VALUE")/g" \
  -e "s/__VITE_APP_URL__/$(escape_sed "$VITE_APP_URL")/g" \
  -e "s/__VITE_SUPABASE_URL__/$(escape_sed "$VITE_SUPABASE_URL")/g" \
  -e "s/__VITE_SUPABASE_PUBLISHABLE_KEY__/$(escape_sed "$VITE_SUPABASE_PUBLISHABLE_KEY")/g" \
  -e "s/__DATABASE_URL__/$(escape_sed "$DATABASE_URL")/g" \
  -e "s/__SUPABASE_URL__/$(escape_sed "$SUPABASE_URL")/g" \
  -e "s/__SUPABASE_ANON_KEY__/$(escape_sed "$SUPABASE_ANON_KEY")/g" \
  -e "s/__SUPABASE_SERVICE_ROLE_KEY__/$(escape_sed "$SUPABASE_SERVICE_ROLE_KEY")/g" \
  -e "s/__JWT_SECRET__/$(escape_sed "$JWT_SECRET")/g" \
  "$output"

rm -f "$output.bak"
