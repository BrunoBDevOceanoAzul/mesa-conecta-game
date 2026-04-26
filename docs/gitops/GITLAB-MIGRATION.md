# Migrando CI/CD do GitHub Actions para GitLab CI

## Por que GitLab CI?

O GitHub Actions está bloqueado por billing issue. O GitLab CI/CD oferece:
- **400 minutos/mês** de runners compartilhados gratuitos
- Integração nativa com Container Registry
- Suporte a Kubernetes (agente KAS)
- Não requer cartão de crédito para tier gratuito

---

## Passo 1: Criar Projeto no GitLab

1. Acesse [gitlab.com](https://gitlab.com)
2. Crie um novo projeto: **mesa-conecta-game**
3. Importe o repositório do GitHub ou faça push direto

---

## Passo 2: Configurar Variáveis de CI/CD

Em **Settings > CI/CD > Variables**, adicione:

### Secrets (Masked + Protected)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL do Postgres Supabase | `postgresql://...` |
| `SUPABASE_URL` | URL do projeto Supabase | `https://xqjiizwtfavpvxytqzvv.supabase.co` |
| `SUPABASE_ANON_KEY` | Anon key do Supabase | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | `eyJhbG...` |
| `JWT_SECRET` | Secret para JWT | `openssl rand -base64 64` |
| `SENDGRID_API_KEY` | API key SendGrid | `SG.xxx...` |
| `KUBECONFIG_DEV` | kubeconfig base64 do dev | `cat ~/.kube/config \| base64` |
| `KUBECONFIG_HOMOLOG` | kubeconfig base64 homolog | `cat ~/.kube/config \| base64` |
| `KUBECONFIG_PROD` | kubeconfig base64 prod | `cat ~/.kube/config \| base64` |
| `VITE_SUPABASE_URL` | URL Supabase para build | `https://...` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon key para build | `eyJhbG...` |

### Variables (Não-secretas)

| Variável | Valor |
|----------|-------|
| `VITE_APP_URL` | `https://dev.sociodotabuleiro.app.br` |
| `DOCKER_DRIVER` | `overlay2` |
| `DOCKER_TLS_CERTDIR` | `""` |

---

## Passo 3: Ajustar Kustomize para GitLab Registry

Os overlays K8s precisam apontar para o GitLab Container Registry.

Edite `k8s/overlays/dev/kustomization.yaml`:
```yaml
images:
  - name: ghcr.io/brunobdevoceanoazul/mesa-conecta-game/mesa-web
    newName: registry.gitlab.com/seu-user/mesa-conecta-game/mesa-web
    newTag: develop
  - name: ghcr.io/brunobdevoceanoazul/mesa-conecta-game/mesa-api
    newName: registry.gitlab.com/seu-user/mesa-conecta-game/mesa-api
    newTag: develop
```

Ou configure o pipeline para fazer `kustomize edit set image` antes do deploy.

---

## Passo 4: Criar Image Pull Secret (se usar GitLab Registry)

O cluster precisa acessar o GitLab Registry:

```bash
# Gerar token de deploy no GitLab (Settings > Repository > Deploy tokens)
# Crie um token com scope: read_registry

kubectl create secret docker-registry gitlab-registry \
  --docker-server=registry.gitlab.com \
  --docker-username=<deploy-token-name> \
  --docker-password=<deploy-token-password> \
  --namespace=mesa-dev

# Repetir para mesa-homolog e mesa-prod
```

Atualize os deployments para usar `imagePullSecrets`.

---

## Passo 5: Migrar Sealed Secrets

Os Sealed Secrets já estão no cluster e são agnósticos de CI. Não precisam ser recriados.

---

## Passo 6: Testar Pipeline

1. Faça push para branch `develop`
2. Acesse **CI/CD > Pipelines** no GitLab
3. Verifique se build, scan e deploy passam

---

## Diferenças GitHub Actions vs GitLab CI

| Aspecto | GitHub Actions | GitLab CI |
|---------|---------------|-----------|
| Arquivo | `.github/workflows/*.yml` | `.gitlab-ci.yml` |
| Runner gratuito | 2.000 min/mês (bloqueado) | 400 min/mês |
| Registry | GHCR | GitLab Registry (incluso) |
| Syntax | `jobs:` | `stages:` + `jobs:` |
| Condicionais | `if:` | `rules:` / `only:` |
| Artefatos | `actions/upload-artifact` | `artifacts:` nativo |
| Cache | `actions/cache` | `cache:` nativo |
| Environments | `environment:` | `environment:` (similar) |

---

## Rollback

Se precisar voltar para GitHub Actions:
1. Remova `.gitlab-ci.yml`
2. Restaure `.github/workflows/ci-cd-doks.yml`
3. Resolva o billing issue no GitHub
4. Atualize os overlays K8s para apontar de volta ao GHCR
