#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────
# GitLab MR Creator - Sócio do Tabuleiro
# ──────────────────────────────────────────────────────────────────
# Uso: ./scripts/open-mr.sh <GITLAB_PRIVATE_TOKEN>
#
# Este script cria um Merge Request no GitLab de develop → main
# automaticamente via API, pronto para integração em pipelines CI/CD.
# ──────────────────────────────────────────────────────────────────

GITLAB_TOKEN="${1:-${GITLAB_PRIVATE_TOKEN:-${CI_JOB_TOKEN:-}}}"
PROJECT_ID="socio-do-tabuleiro%2Fsocio-do-tabuleiro"
SOURCE_BRANCH="develop"
TARGET_BRANCH="main"
GITLAB_API="https://gitlab.com/api/v4"

# ─── Helpers ──────────────────────────────────────────────────────

error() { echo "❌ ERRO: $*" >&2; exit 1; }
info()  { echo "ℹ️  $*"; }
success() { echo "✅ $*"; }

# ─── Validação ────────────────────────────────────────────────────

if ! command -v curl >/dev/null 2>&1; then
  error "curl não encontrado. Instale: brew install curl"
fi

if [ -z "$GITLAB_TOKEN" ]; then
  error "Token do GitLab não fornecido.

Uso:
  ./scripts/open-mr.sh <SEU_GITLAB_PRIVATE_TOKEN>

Ou configure a variável de ambiente:
  export GITLAB_PRIVATE_TOKEN=glpat-xxxxxxxx
  ./scripts/open-mr.sh

Para criar um token:
  https://gitlab.com/-/profile/personal_access_tokens
  (scopes necessários: api, read_repository, write_repository)"
fi

# ─── Verificar se MR já existe ────────────────────────────────────

info "Verificando se já existe um MR aberto $SOURCE_BRANCH → $TARGET_BRANCH..."

EXISTING_MR=$(curl -sSf --retry 3 \
  --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "${GITLAB_API}/projects/${PROJECT_ID}/merge_requests?state=opened&source_branch=${SOURCE_BRANCH}&target_branch=${TARGET_BRANCH}" \
  | jq -r '.[0].iid // empty' 2>/dev/null || true)

if [ -n "$EXISTING_MR" ] && [ "$EXISTING_MR" != "null" ]; then
  MR_URL="https://gitlab.com/socio-do-tabuleiro/socio-do-tabuleiro/-/merge_requests/${EXISTING_MR}"
  info "MR já existe: ${MR_URL}"
  echo ""
  echo "🚀 Para revisar/mergear: ${MR_URL}"
  exit 0
fi

# ─── Criar MR ─────────────────────────────────────────────────────

info "Criando Merge Request: ${SOURCE_BRANCH} → ${TARGET_BRANCH}..."

RESPONSE=$(curl -sSf --retry 3 -X POST \
  --header "PRIVATE-TOKEN: ${GITLAB_TOKEN}" \
  --header "Content-Type: application/json" \
  "${GITLAB_API}/projects/${PROJECT_ID}/merge_requests" \
  -d @- <<EOF
{
  "source_branch": "${SOURCE_BRANCH}",
  "target_branch": "${TARGET_BRANCH}",
  "title": "[release] Merge develop into main - Next.js 14 + Hive + Customer.io",
  "description": "## Merge de Release\n\n### Mudanças Principais\n\n- **Frontend**: Migração completa para Next.js 14 (Pages Router)\n  - 58 páginas estáticas geradas com sucesso\n  - Build passando sem erros\n  - SSR desabilitado para compatibilidade com SPA legado\n\n- **Hive Interface**: Nova interface principal\n  - HiveLayout como layout raiz\n  - FrequencyRouter com query params\n  - OverlayManager com stack de overlays\n  - 25+ redirecionamentos de URLs legadas para Hive\n\n- **Customer.io CDP**: Integração de email e event tracking\n  - CDP Service com event tracking e profile sync\n  - Supabase edge function atualizada\n  - Scripts de configuração e teste\n\n- **Infraestrutura**:\n  - DigitalOcean App Specs atualizados (dev/prod)\n  - Variáveis de ambiente documentadas\n  - .next/ adicionado ao .gitignore\n\n### Validações\n- ✅ Backend typecheck passando\n- ✅ Backend tests: 28/28 passando\n- ✅ Frontend tests: 1/1 passando\n- ✅ Frontend build: 58/58 páginas geradas\n\n### Deploy\nApós merge, o deploy para produção será automático via GitLab CI/CD.",
  "remove_source_branch": false,
  "squash": false
}
EOF
)

# ─── Resultado ────────────────────────────────────────────────────

MR_IID=$(echo "$RESPONSE" | jq -r '.iid // empty')
MR_URL=$(echo "$RESPONSE" | jq -r '.web_url // empty')
MR_STATE=$(echo "$RESPONSE" | jq -r '.state // empty')

if [ -n "$MR_IID" ] && [ "$MR_IID" != "null" ]; then
  success "Merge Request criado com sucesso!"
  echo ""
  echo "  📋 Título:  [release] Merge develop into main - Next.js 14 + Hive + Customer.io"
  echo "  🔗 URL:     ${MR_URL}"
  echo "  📊 Estado:  ${MR_STATE}"
  echo "  🌿 Branch:  ${SOURCE_BRANCH} → ${TARGET_BRANCH}"
  echo ""
  echo "🚀 Próximos passos:"
  echo "   1. Revisar o MR: ${MR_URL}"
  echo "   2. Aprovar e fazer merge quando o CI passar"
  echo "   3. O deploy para produção será automático"
else
  error "Falha ao criar MR. Resposta da API:\n${RESPONSE}"
fi
