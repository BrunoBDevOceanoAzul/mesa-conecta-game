# GitOps Baseline

This project uses a GitOps deployment model for the frontend.

## Flow

1. A commit lands in Git.
2. GitHub Actions validates the application.
3. GitHub Actions builds a Docker image.
4. The image is pushed to GHCR.
5. Argo CD syncs the declarative state from `k8s/overlays/*`.
6. Kubernetes performs a rolling update of the `mesa-web` pods.

## Open-source versions

- Node.js: `22.16.0`
- NGINX: `1.27.4`
- Kubernetes: `1.30+`
- Argo CD: `2.13+`
- Argo CD Image Updater: `0.15+`
- Sealed Secrets: `0.27+`
- Prometheus Operator: `0.77+`

## Secret management

Frontend `NEXT_PUBLIC_*` values are public client configuration and are injected at build time through GitHub Actions secrets/variables:

- `secrets.NEXT_PUBLIC_SUPABASE_URL`
- `secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `vars.NEXT_PUBLIC_APP_URL`

Kubernetes runtime secrets are represented with Bitnami Sealed Secrets for future server-side or runtime configuration. Generate encrypted secret manifests with:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xqjiizwtfavpvxytqzvv.supabase.co" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..." \
./scripts/seal-mesa-web-secrets.sh
```

Commit only the sealed output, never raw secrets.

## Rollback

Rollback is handled in two layers:

- Kubernetes rolling updates keep the previous ReplicaSet available during deployment.
- `scripts/gitops-rollback.sh` can roll back the deployment if health checks fail after sync.

Argo CD also has `selfHeal` enabled to restore declarative state from Git.
