#!/usr/bin/env bash
# =============================================================================
# Setup GitLab CI/CD Variables — Mesa Conecta
# =============================================================================
# Este script automatiza a criação de todas as variáveis de CI/CD no GitLab
# via API v4. Requer um Personal Access Token (PAT) com scope 'api'.
#
# Uso:
#   1. Crie um PAT em: https://gitlab.com/-/profile/personal_access_tokens
#      (marque o scope 'api')
#   2. Exporte: export GITLAB_TOKEN=glpat-xxxxxxxxxxxx
#   3. Execute: ./scripts/setup-gitlab-variables.sh
# =============================================================================

set -euo pipefail

PROJECT_PATH="socio-do-tabuleiro/socio-do-tabuleiro"
GITLAB_API="https://gitlab.com/api/v4"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# UTILS
# =============================================================================

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# VERIFICAÇÕES INICIAIS
# =============================================================================

if ! command -v curl &> /dev/null; then
    log_error "curl não está instalado. Instale com: brew install curl"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log_warn "jq não está instalado. Instale com: brew install jq"
    log_info "Continuando sem jq (menos feedback visual)..."
    HAS_JQ=false
else
    HAS_JQ=true
fi

if [ -z "${GITLAB_TOKEN:-}" ]; then
    log_error "GITLAB_TOKEN não definido."
    echo ""
    echo "Para criar um Personal Access Token:"
    echo "  1. Acesse: https://gitlab.com/-/profile/personal_access_tokens"
    echo "  2. Clique em 'Add new token'"
    echo "  3. Nome: 'Mesa Conecta CI Setup'"
    echo "  4. Scopes: marque 'api'"
    echo "  5. Clique 'Create personal access token'"
    echo "  6. Copie o token (só aparece uma vez!)"
    echo ""
    echo "Depois execute:"
    echo "  export GITLAB_TOKEN=glpat-xxxxxxxxxxxx"
    echo "  $0"
    echo ""
    exit 1
fi

log_info "Verificando token..."
TOKEN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
    --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "$GITLAB_API/user")

if [ "$TOKEN_CHECK" != "200" ]; then
    log_error "Token inválido ou sem permissão. HTTP $TOKEN_CHECK"
    log_info "Verifique se o token tem scope 'api' e não expirou."
    exit 1
fi

log_ok "Token válido!"

# =============================================================================
# VERIFICAR PROJETO
# =============================================================================

log_info "Verificando projeto '$PROJECT_PATH'..."
PROJECT_RESPONSE=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "$GITLAB_API/projects/$(echo "$PROJECT_PATH" | sed 's/\//%2F/g')")

if [ "$HAS_JQ" = true ]; then
    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.id // empty')
    PROJECT_NAME=$(echo "$PROJECT_RESPONSE" | jq -r '.name // empty')
else
    PROJECT_ID=$(echo "$PROJECT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
    PROJECT_NAME=$(echo "$PROJECT_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
    log_error "Projeto '$PROJECT_PATH' não encontrado ou sem acesso."
    exit 1
fi

log_ok "Projeto encontrado: $PROJECT_NAME (ID: $PROJECT_ID)"

# =============================================================================
# FUNÇÃO PARA CRIAR VARIÁVEL
# =============================================================================

create_variable() {
    local key="$1"
    local value="$2"
    local masked="${3:-false}"
    local protected="${4:-true}"
    local variable_type="${5:-env_var}"  # env_var ou file

    log_info "Criando variável: $key"

    local mask_param=""
    local protect_param=""

    if [ "$masked" = "true" ]; then
        mask_param="--form masked=true"
    fi

    if [ "$protected" = "true" ]; then
        protect_param="--form protected=true"
    fi

    # Escapar o valor para curl
    local escaped_value
    escaped_value=$(printf '%s' "$value" | sed 's/"/\\"/g')

    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        --request POST \
        --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        --form "key=$key" \
        --form "value=$escaped_value" \
        --form "variable_type=$variable_type" \
        $mask_param \
        $protect_param \
        "$GITLAB_API/projects/$PROJECT_ID/variables")

    if [ "$RESPONSE" = "201" ]; then
        log_ok "  $key criada com sucesso"
    elif [ "$RESPONSE" = "409" ]; then
        log_warn "  $key já existe. Pulando..."
    else
        log_error "  Falha ao criar $key (HTTP $RESPONSE)"
    fi
}

# =============================================================================
# VARIÁVEIS — CONFIGURAÇÃO
# =============================================================================

echo ""
echo "============================================================="
echo "  Configuração de Variáveis — Mesa Conecta"
echo "============================================================="
echo ""

# Perguntar valores que não temos ou confirmar os que temos
read -rp "DATABASE_URL [pressione Enter para usar o default]: " DATABASE_URL_INPUT
DATABASE_URL="${DATABASE_URL_INPUT:-postgresql://postgres.xqjiizwtfavpvxytqzvv:Amor121314%40%23%24@aws-1-us-west-2.pooler.supabase.com:6543/postgres}"

read -rp "SUPABASE_URL [pressione Enter para usar o default]: " SUPABASE_URL_INPUT
SUPABASE_URL="${SUPABASE_URL_INPUT:-https://xqjiizwtfavpvxytqzvv.supabase.co}"

read -rp "SUPABASE_ANON_KEY [pressione Enter para usar o default]: " SUPABASE_ANON_KEY_INPUT
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY_INPUT:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxamlpend0ZmF2cHZ4eXRxenZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzM5NjIsImV4cCI6MjA5MjQ0OTk2Mn0.3ojuxj5hqNA-QUryH9rjgRuYoKMdV4T8SkGcq0GwipE}"

read -rp "SUPABASE_SERVICE_ROLE_KEY [pressione Enter para usar o default]: " SUPABASE_SERVICE_ROLE_KEY_INPUT
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY_INPUT:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxamlpend0ZmF2cHZ4eXRxenZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg3Mzk2MiwiZXhwIjoyMDkyNDQ5OTYyfQ.MwqAo-j9-ALbr35HvqzMz7W-zDpFZr-Cp7DVZ2Q89-U}"

read -rp "JWT_SECRET [pressione Enter para usar o default]: " JWT_SECRET_INPUT
JWT_SECRET="${JWT_SECRET_INPUT:-zhlFzLDEoDjh1/P3/lnQ4pwgjoqn1vlteuefpaWcCWoKzdGcgk4niPloFEKU6qcyHM0uFdFhldPV0PlW9XcTVg==}"

read -rp "SENDGRID_API_KEY (deixe em branco se não tiver ainda): " SENDGRID_API_KEY_INPUT
SENDGRID_API_KEY="${SENDGRID_API_KEY_INPUT:-}"

read -rp "VITE_SUPABASE_URL [pressione Enter para usar o default]: " VITE_SUPABASE_URL_INPUT
VITE_SUPABASE_URL="${VITE_SUPABASE_URL_INPUT:-https://xqjiizwtfavpvxytqzvv.supabase.co}"

read -rp "VITE_SUPABASE_PUBLISHABLE_KEY [pressione Enter para usar o default]: " VITE_SUPABASE_PUBLISHABLE_KEY_INPUT
VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY_INPUT:-sb_publishable_Su1aBS5317eyJB5xnpjuPg_TwxkswXr}"

# URLs por ambiente (DOKS + Cloudflare)
VITE_APP_URL_DEV="https://dev.sociodotabuleiro.app.br"
VITE_APP_URL_HOMOLOG="https://homolog.sociodotabuleiro.app.br"
VITE_APP_URL_PROD="https://sociodotabuleiro.app.br"

echo ""
echo "URLs configuradas:"
echo "  Dev:     $VITE_APP_URL_DEV"
echo "  Homolog: $VITE_APP_URL_HOMOLOG"
echo "  Prod:    $VITE_APP_URL_PROD"
echo ""

read -rp "VITE_APP_URL (default dev) [pressione Enter]: " VITE_APP_URL_INPUT
VITE_APP_URL="${VITE_APP_URL_INPUT:-$VITE_APP_URL_DEV}"

# KUBECONFIGs
log_info "Gerando KUBECONFIGs em base64..."
KUBECONFIG_DEV=$(kubectl config view --minify --raw 2>/dev/null | base64 | tr -d '\n' || echo "")
KUBECONFIG_HOMOLOG="$KUBECONFIG_DEV"
KUBECONFIG_PROD="$KUBECONFIG_DEV"

if [ -z "$KUBECONFIG_DEV" ]; then
    log_warn "kubectl não encontrado ou kubeconfig vazio."
    read -rp "Cole o KUBECONFIG_DEV em base64 (ou deixe em branco): " KUBECONFIG_DEV
    read -rp "Cole o KUBECONFIG_HOMOLOG em base64 (ou deixe em branco): " KUBECONFIG_HOMOLOG
    read -rp "Cole o KUBECONFIG_PROD em base64 (ou deixe em branco): " KUBECONFIG_PROD
else
    log_ok "Kubeconfigs gerados automaticamente do contexto atual ($kubectl config current-context 2>/dev/null || echo 'default')"
fi

# =============================================================================
# CRIAR VARIÁVEIS
# =============================================================================

echo ""
log_info "Criando variáveis no GitLab..."
echo ""

# Secrets (masked + protected)
create_variable "DATABASE_URL" "$DATABASE_URL" true true
create_variable "SUPABASE_URL" "$SUPABASE_URL" true true
create_variable "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" true true
create_variable "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" true true
create_variable "JWT_SECRET" "$JWT_SECRET" true true

if [ -n "$SENDGRID_API_KEY" ]; then
    create_variable "SENDGRID_API_KEY" "$SENDGRID_API_KEY" true true
else
    log_warn "SENDGRID_API_KEY vazio — notificações por email não funcionarão"
fi

if [ -n "$KUBECONFIG_DEV" ]; then
    create_variable "KUBECONFIG_DEV" "$KUBECONFIG_DEV" true true
else
    log_warn "KUBECONFIG_DEV vazio — deploy para dev não funcionará"
fi

if [ -n "$KUBECONFIG_HOMOLOG" ]; then
    create_variable "KUBECONFIG_HOMOLOG" "$KUBECONFIG_HOMOLOG" true true
else
    log_warn "KUBECONFIG_HOMOLOG vazio — deploy para homolog não funcionará"
fi

if [ -n "$KUBECONFIG_PROD" ]; then
    create_variable "KUBECONFIG_PROD" "$KUBECONFIG_PROD" true true
else
    log_warn "KUBECONFIG_PROD vazio — deploy para prod não funcionará"
fi

create_variable "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL" true true
create_variable "VITE_SUPABASE_PUBLISHABLE_KEY" "$VITE_SUPABASE_PUBLISHABLE_KEY" true true

# Variables (não-secretas, não masked)
create_variable "VITE_APP_URL" "$VITE_APP_URL" false true

# Docker-in-Docker config (obrigatório para GitLab shared runners)
create_variable "DOCKER_DRIVER" "overlay2" false false
create_variable "DOCKER_TLS_CERTDIR" "" false false
create_variable "DOCKER_BUILDKIT" "1" false false

# =============================================================================
# RESUMO
# =============================================================================

echo ""
echo "============================================================="
echo "  Resumo da Configuração"
echo "============================================================="
echo ""

if [ "$HAS_JQ" = true ]; then
    curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        "$GITLAB_API/projects/$PROJECT_ID/variables?per_page=100" | \
        jq -r '.[] | "  \(.key) (\(.variable_type), protected: \(.protected), masked: \(.masked // false))"' | sort
else
    log_info "Instale jq para ver o resumo formatado."
    log_info "Variáveis criadas. Verifique em:"
    echo "  https://gitlab.com/$PROJECT_PATH/-/settings/ci_cd"
fi

echo ""
log_ok "Setup completo!"
echo ""
echo "Próximo passo:"
echo "  1. Acesse: https://gitlab.com/$PROJECT_PATH/-/pipelines"
echo "  2. Faça um push para a branch 'develop'"
echo "  3. Acompanhe a pipeline!"
echo ""
