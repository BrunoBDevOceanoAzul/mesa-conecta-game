#!/usr/bin/env bash
set -euo pipefail

# Open-source component versions used by this GitOps baseline:
# Kubernetes: 1.30+
# Argo CD: 2.13+
# Argo CD Image Updater: 0.15+
# Sealed Secrets: 0.27+
# kube-prometheus-stack / Prometheus Operator: 0.77+

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

kubectl apply -k "${ROOT_DIR}/k8s/overlays/production"
kubectl -n argocd apply -f "${ROOT_DIR}/k8s/manifests/argocd-application.yaml"

echo "GitOps bootstrap applied. Argo CD will keep the cluster in sync with Git."
