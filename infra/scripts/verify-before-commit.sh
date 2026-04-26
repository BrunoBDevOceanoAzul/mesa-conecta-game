#!/usr/bin/env sh
set -eu

if git diff --cached --name-only -- AGENTS.md | grep -q '^AGENTS.md$'; then
  echo "AGENTS.md is local operational memory and must not be committed."
  echo "Run: git restore --staged AGENTS.md"
  exit 1
fi

echo "Running backend typecheck..."
NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/mesa-npm-cache}" npm --prefix backend run typecheck

echo "Running backend tests..."
NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/mesa-npm-cache}" npm --prefix backend test

echo "Running backend production build..."
NPM_CONFIG_CACHE="${NPM_CONFIG_CACHE:-/tmp/mesa-npm-cache}" npm --prefix backend run build

echo "Running frontend tests..."
npm test
