#!/usr/bin/env bash
set -euo pipefail

api_base_url="${CUSTOMERIO_CDP_API_BASE_URL:-https://cdp.customer.io/v1}"
test_user_id="${CUSTOMERIO_TEST_USER_ID:-customerio-cli-test}"
test_email="${CUSTOMERIO_TEST_EMAIL:-bruno@sociodotabuleiro.app.br}"
test_name="${CUSTOMERIO_TEST_NAME:-Sócio do Tabuleiro}"

write_key="${CUSTOMERIO_EVENTS_WRITE_KEY:-${CUSTOMERIO_CDP_WRITE_KEY:-}}"

if [[ -z "${write_key}" ]]; then
  echo "Missing required env var: CUSTOMERIO_EVENTS_WRITE_KEY or CUSTOMERIO_CDP_WRITE_KEY" >&2
  exit 1
fi

payload="$(
  node -e '
    process.stdout.write(JSON.stringify({
      userId: process.env.CUSTOMERIO_TEST_USER_ID || "customerio-cli-test",
      traits: {
        name: process.env.CUSTOMERIO_TEST_NAME || "Sócio do Tabuleiro",
        email: process.env.CUSTOMERIO_TEST_EMAIL || "bruno@sociodotabuleiro.app.br",
      },
    }));
  '
)"

curl --fail-with-body --silent --show-error \
  --request POST "${api_base_url%/}/identify" \
  --user "${write_key}:" \
  --header "content-type: application/json" \
  --data "${payload}" >/dev/null

echo "Customer.io CDP identify test sent for ${test_user_id} (${test_email})"
