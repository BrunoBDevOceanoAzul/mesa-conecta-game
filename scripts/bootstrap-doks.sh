#!/usr/bin/env bash
set -euo pipefail

echo "=================================="
echo "MESA DOKS Bootstrap Script"
echo "=================================="
echo ""

# Verificar dependências
command -v kubectl >/dev/null 2>&1 || { echo "kubectl não encontrado. Instale: brew install kubectl"; exit 1; }
command -v kubeseal >/dev/null 2>&1 || { echo "kubeseal não encontrado. Instale: brew install kubeseal"; exit 1; }

# Verificar certificado
CERT="${CERT:-sealed-secrets-cert.pem}"
if [[ ! -f "$CERT" ]]; then
  echo "Certificado não encontrado: $CERT"
  echo "Buscando do cluster..."
  kubeseal --controller-name=sealed-secrets-controller --controller-namespace=kube-system --fetch-cert > "$CERT"
  echo "Certificado salvo em: $CERT"
fi

# Verificar variáveis necessárias
check_env() {
  local var=$1
  if [[ -z "${!var:-}" ]]; then
    echo "ERRO: Variável $var não definida"
    return 1
  fi
}

echo "Verificando variáveis de ambiente..."
REQUIRED_VARS=("DATABASE_URL" "SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
  if ! check_env "$var" 2>/dev/null; then
    echo ""
    echo "Defina as seguintes variáveis antes de continuar:"
    echo "  export DATABASE_URL='postgres://...'"
    echo "  export SUPABASE_URL='https://...'"
    echo "  export SUPABASE_ANON_KEY='eyJ...'"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='eyJ...'"
    echo "  export JWT_SECRET='...'"
    echo "  export CLOUDFLARE_API_TOKEN='...' (opcional)"
    exit 1
  fi
done

echo "Todas as variáveis encontradas ✅"
echo ""

# Gerar secrets para cada ambiente
generate_sealed_secret() {
  local namespace=$1
  local output=$2
  
  echo "Gerando SealedSecret para $namespace..."
  
  kubectl create secret generic mesa-secrets \
    --namespace="$namespace" \
    --from-literal=DATABASE_URL="$DATABASE_URL" \
    --from-literal=SUPABASE_URL="$SUPABASE_URL" \
    --from-literal=SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    --from-literal=SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}" \
    --dry-run=client -o yaml \
    | kubeseal --cert="$CERT" --format yaml > "$output"
  
  echo "  ✅ $output"
}

generate_sealed_secret "mesa-dev" "k8s/overlays/dev/sealed-secret.yaml"
generate_sealed_secret "mesa-homolog" "k8s/overlays/homolog/sealed-secret.yaml"
generate_sealed_secret "mesa-prod" "k8s/overlays/prod/sealed-secret.yaml"

echo ""
echo "=================================="
echo "Sealed Secrets gerados com sucesso!"
echo "=================================="
echo ""
echo "Próximos passos:"
echo "  1. git add k8s/overlays/*/sealed-secret.yaml"
echo "  2. git commit -m 'feat(secrets): add sealed secrets for all environments'"
echo "  3. git push"
echo ""
echo "Para aplicar no cluster:"
echo "  kubectl apply -k k8s/overlays/dev"
echo "  kubectl apply -k k8s/overlays/homolog"
echo "  kubectl apply -k k8s/overlays/prod"
