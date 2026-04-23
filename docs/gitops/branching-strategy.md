# Branching Strategy

Use branches to keep product, backend and infrastructure work isolated.

## Long-lived branches

- `main`: production-ready declarative state.
- `develop`: integration branch for validated work before production promotion.

## Work branches

- `frontend-*`: frontend UI and client integration work.
- `api-*`: `mesa` API and backend work.
- `infra-*`: Docker, Kubernetes, Argo CD, CI/CD and cloud operations.
- `db-*`: Supabase, Drizzle schema and migrations.
- `hotfix-*`: urgent production fixes.

## PR targets

- Feature branches open PRs into `develop` by default.
- Release or production-ready PRs go from `develop` into `main`.
- Infrastructure changes that affect production manifests require explicit review before merge into `main`.

## Current branch

This PR uses `frontend-gitops-mesa-baseline` because a slash-prefixed `frontend/*` branch could not be created in this local checkout. Future work should prefer the prefix conventions above when the local Git refs allow it.
