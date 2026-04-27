#!/usr/bin/env bash
set -euo pipefail

project_ref="${SUPABASE_PROJECT_REF:-xqjiizwtfavpvxytqzvv}"
site_url="${SUPABASE_AUTH_SITE_URL:-https://socio-app-4twao.ondigitalocean.app}"
uri_allow_list="${SUPABASE_AUTH_URI_ALLOW_LIST:-https://socio-app-4twao.ondigitalocean.app/~oauth,https://dev.sociodotabuleiro.app.br/~oauth,https://homolog.sociodotabuleiro.app.br/~oauth,https://sociodotabuleiro.app.br/~oauth,http://localhost:3000/~oauth,http://127.0.0.1:3000/~oauth,http://localhost:8080/~oauth,http://127.0.0.1:8080/~oauth}"

required_vars=(
  SUPABASE_ACCESS_TOKEN
  GOOGLE_OAUTH_CLIENT_ID
  GOOGLE_OAUTH_CLIENT_SECRET
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Missing required env var: ${var_name}" >&2
    exit 1
  fi
done

payload="$(
  node -e '
    const payload = {
      site_url: process.env.SUPABASE_AUTH_SITE_URL || "https://socio-app-4twao.ondigitalocean.app",
      uri_allow_list: process.env.SUPABASE_AUTH_URI_ALLOW_LIST || "https://socio-app-4twao.ondigitalocean.app/~oauth,https://dev.sociodotabuleiro.app.br/~oauth,https://homolog.sociodotabuleiro.app.br/~oauth,https://sociodotabuleiro.app.br/~oauth,http://localhost:3000/~oauth,http://127.0.0.1:3000/~oauth,http://localhost:8080/~oauth,http://127.0.0.1:8080/~oauth",
      external_google_enabled: true,
      external_google_client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
      external_google_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      external_google_skip_nonce_check: false,
    };
    process.stdout.write(JSON.stringify(payload));
  '
)"

curl --fail-with-body --silent --show-error \
  --request PATCH "https://api.supabase.com/v1/projects/${project_ref}/config/auth" \
  --header "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --data "${payload}" >/dev/null

echo "Google Auth enabled for Supabase project ${project_ref}"
echo "Site URL: ${site_url}"
echo "Redirect allow list: ${uri_allow_list}"
echo
echo "Google OAuth client must include this authorized redirect URI:"
echo "https://${project_ref}.supabase.co/auth/v1/callback"
