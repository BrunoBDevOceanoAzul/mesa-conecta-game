#!/bin/bash
set -e

echo "=== Mesa Unified Build ==="
echo "Installing root dependencies..."
npm ci

echo "Installing API dependencies..."
cd apps/mesa-api
npm ci
cd ../..

echo "Running API typecheck and tests..."
cd apps/mesa-api
npm run typecheck
npm test
cd ../..

echo "Building frontend..."
npm run build

echo "Building API..."
cd apps/mesa-api
npm run build

echo "=== Build complete ==="
