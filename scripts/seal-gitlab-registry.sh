#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Seal GitLab Registry imagePullSecret for all environments
# =============================================================================
# Usage:
#   export GITLAB_REGISTRY_USER="gitlab+deploy-token-xxx"
#   export GITLAB_REGISTRY_PASS="seu-token-aqui"
#   ./scripts/seal-gitlab-registry.sh
#
# Requirements:
#   - kubeseal CLI installed
#   - kubectl configured para o cluster DOKS
#   - Sealed Secrets controller rodando em kube-system
# =============================================================================

GITLAB_REGISTRY_USER="${GITLAB_REGISTRY_USER:-}"
GITLAB_REGISTRY_PASS="${GITLAB_REGISTRY_PASS:-}"
REGISTRY="registry.gitlab.com"
PROJECT_PATH="socio-do-tabuleiro/socio-do-tabuleiro"
EMAIL="deploy@mesaconecta.com"

if [[ -z "$GITLAB_REGISTRY_USER" || -z "$GITLAB_REGISTRY_PASS" ]]; then
  echo "ERRO: defina GITLAB_REGISTRY_USER e GITLAB_REGISTRY_PASS"
  echo "Exemplo:"
  echo '  export GITLAB_REGISTRY_USER="gitlab+deploy-token-123"'
  echo '  export GITLAB_REGISTRY_PASS="gldt-xxx"'
  exit 1
fi

# Gera o auth base64
AUTH_B64=$(echo -n "${GITLAB_REGISTRY_USER}:${GITLAB_REGISTRY_PASS}" | base64)

# Gera o dockerconfigjson
DOCKER_CONFIG=$(cat <<EOF
{
  "auths": {
    "${REGISTRY}": {
      "username": "${GITLAB_REGISTRY_USER}",
      "password": "${GITLAB_REGISTRY_PASS}",
      "email": "${EMAIL}",
      "auth": "${AUTH_B64}"
    }
  }
}
EOF
)

# Função para selar em um namespace
seal_for_ns() {
  local ns=$1
  local outfile=$2

  echo "Gerando SealedSecret para namespace: ${ns}..."

  kubectl create secret docker-registry gitlab-registry \
    --docker-server="${REGISTRY}" \
    --docker-username="${GITLAB_REGISTRY_USER}" \
    --docker-password="${GITLAB_REGISTRY_PASS}" \
    --docker-email="${EMAIL}" \
    --namespace="${ns}" \
    --dry-run=client -o yaml | \
    kubeseal --controller-namespace=kube-system --format yaml > "${outfile}"

  echo "  ✓ Salvo em: ${outfile}"
}

# Selar para cada ambiente
seal_for_ns "mesa-dev" "k8s/overlays/dev/sealed-registry-secret.yaml"
seal_for_ns "mesa-homolog" "k8s/overlays/homolog/sealed-registry-secret.yaml"
seal_for_ns "mesa-prod" "k8s/overlays/prod/sealed-registry-secret.yaml"

echo ""
echo "✅ SealedSecrets gerados com sucesso!"
echo ""
echo "Próximo passo:"
echo "  kubectl apply -f k8s/overlays/dev/sealed-registry-secret.yaml"
echo "  kubectl apply -f k8s/overlays/homolog/sealed-registry-secret.yaml"
echo "  kubectl apply -f k8s/overlays/prod/sealed-registry-secret.yaml"
