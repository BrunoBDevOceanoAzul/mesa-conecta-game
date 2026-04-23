#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="${1:-mesa}"
DEPLOYMENT="${2:-mesa-web}"

kubectl -n "${NAMESPACE}" rollout undo "deployment/${DEPLOYMENT}"
kubectl -n "${NAMESPACE}" rollout status "deployment/${DEPLOYMENT}" --timeout=120s

echo "Rollback completed for deployment/${DEPLOYMENT} in namespace ${NAMESPACE}."
