#!/bin/bash
set -e

echo "=== Mesa Unified Build ==="

# Detecta se estamos na raiz ou em apps/mesa-api
if [ -d "apps/mesa-api" ]; then
  ROOT_DIR="$(pwd)"
  API_DIR="$ROOT_DIR/apps/mesa-api"
elif [ -f "../../package.json" ] && [ -d "../../src" ]; then
  # Estamos em apps/mesa-api
  API_DIR="$(pwd)"
  ROOT_DIR="$(dirname "$(dirname "$API_DIR")")"
else
  echo "ERROR: Cannot determine project root"
  exit 1
fi

echo "Root: $ROOT_DIR"
echo "API:  $API_DIR"

cd "$ROOT_DIR"
echo "Installing root dependencies..."
npm ci

cd "$API_DIR"
echo "Installing API dependencies..."
npm ci

echo "Running API typecheck..."
npm run typecheck

echo "Running API tests..."
npm test

cd "$ROOT_DIR"
echo "Building frontend..."
npm run build

cd "$API_DIR"
echo "Building API..."
npm run build

echo "=== Build complete ==="
