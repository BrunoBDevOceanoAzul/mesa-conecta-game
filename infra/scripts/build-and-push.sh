#!/usr/bin/env bash
set -euo pipefail

echo "=================================="
echo "MESA Docker Build & Push Script"
echo "=================================="
echo ""

# Verificar Docker
if ! docker info >/dev/null 2>&1; then
  echo "ERRO: Docker não está rodando."
  echo "Abra o Docker Desktop e tente novamente."
  exit 1
fi

# Configurações
REGISTRY="ghcr.io"
OWNER="brunobdevoceanoazul"
REPO="mesa-conecta-game"
WEB_IMAGE="$REGISTRY/$OWNER/$REPO/mesa-web"
API_IMAGE="$REGISTRY/$OWNER/$REPO/mesa-api"
TAG="${1:-develop}"

echo "Tag: $TAG"
echo ""

# Login no GHCR (se necessário)
echo "Verificando login no GHCR..."
if ! docker pull hello-world >/dev/null 2>&1; then
  echo "Faça login no GHCR:"
  echo "  echo SEU_GITHUB_TOKEN | docker login ghcr.io -u $OWNER --password-stdin"
  exit 1
fi

# Build frontend
echo "=== Buildando frontend ==="
docker build \
  -t "$WEB_IMAGE:$TAG" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://xqjiizwtfavpvxytqzvv.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_Su1aBS5317eyJB5xnpjuPg_TwxkswXr" \
  --build-arg NEXT_PUBLIC_APP_URL="https://sociodotabuleiro.app.br" \
  .

echo "=== Push frontend ==="
docker push "$WEB_IMAGE:$TAG"

# Build backend
echo "=== Buildando backend ==="
docker build \
  -t "$API_IMAGE:$TAG" \
  -f apps/mesa-api/Dockerfile \
  ./apps/mesa-api

echo "=== Push backend ==="
docker push "$API_IMAGE:$TAG"

echo ""
echo "=================================="
echo "Build e push concluídos!"
echo "=================================="
echo ""
echo "Imagens publicadas:"
echo "  $WEB_IMAGE:$TAG"
echo "  $API_IMAGE:$TAG"
echo ""
echo "Para atualizar o cluster:"
echo "  kubectl rollout restart deployment/dev-mesa-web -n mesa-dev"
echo "  kubectl rollout restart deployment/dev-mesa-api -n mesa-dev"
