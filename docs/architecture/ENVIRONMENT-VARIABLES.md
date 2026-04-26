# Variáveis de Ambiente — DigitalOcean App Platform

> Este arquivo documenta o setup de `dev` e `prod` na DigitalOcean. Nunca coloque valores reais aqui.

## Visão geral

O deploy agora assume:

- `develop` -> ambiente `dev`
- `main` -> ambiente `prod`
- cada ambiente usa um app próprio na DigitalOcean App Platform
- cada app possui dois componentes:
  - `mesa-web` como `static_site`
  - `mesa-api` como `service`
- o frontend consome a API no mesmo domínio via `/api`

Arquivos base:

- `.do/app.dev.yaml`
- `.do/app.prod.yaml`
- `scripts/render-do-app-spec.sh`
- `scripts/do-app-apply.sh`
- `.github/workflows/deploy-digitalocean.yml`

## GitHub Environments

Crie dois environments no GitHub:

- `dev`
- `prod`

Cada environment deve ter os mesmos nomes de secrets e variables, com valores próprios.

## Secrets por ambiente

Configurar em `Settings > Environments > <env> > Secrets`.

| Nome | Obrigatória | Uso |
|------|-------------|-----|
| `DIGITALOCEAN_ACCESS_TOKEN` | Sim | Token do `doctl` usado pelo workflow |
| `DO_APP_ID` | Sim | ID do app na DigitalOcean App Platform |
| `DATABASE_URL` | Sim | Connection string do Postgres do Supabase |
| `SUPABASE_URL` | Sim | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Sim | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave de serviço do Supabase |
| `JWT_SECRET` | Sim | Segredo interno da API |
| `VITE_SUPABASE_URL` | Sim | URL pública usada no build do frontend |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave pública usada no build do frontend |

## Variables por ambiente

Configurar em `Settings > Environments > <env> > Variables`.

| Nome | Exemplo dev | Exemplo prod | Uso |
|------|-------------|--------------|-----|
| `DO_APP_NAME` | `mesa-conecta-dev` | `mesa-conecta-prod` | Nome lógico do app |
| `DO_GITHUB_BRANCH` | `develop` | `main` | Branch que o app deve seguir |
| `DO_APP_REGION` | `nyc` | `nyc` | Região do app |
| `DO_NODE_ENV` | `development` | `production` | `NODE_ENV` da API |
| `VITE_APP_URL` | `https://mesa-conecta-dev-xxxxx.ondigitalocean.app` | `https://mesa-conecta-prod-xxxxx.ondigitalocean.app` | URL pública do app |

## Variáveis injetadas no App Platform

O workflow monta o spec final e envia estas variáveis para a DigitalOcean:

### Frontend (`mesa-web`)

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | secret do environment |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | secret do environment |
| `VITE_APP_URL` | variable do environment |
| `VITE_MESA_API_URL` | `/api` |
| `VITE_ENV` | `dev` ou `prod` |

### Backend (`mesa-api`)

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `development` ou `production` |
| `PORT` | `8787` |
| `DATABASE_URL` | secret do environment |
| `SUPABASE_URL` | secret do environment |
| `SUPABASE_ANON_KEY` | secret do environment |
| `SUPABASE_SERVICE_ROLE_KEY` | secret do environment |
| `JWT_SECRET` | secret do environment |

## Primeira criação dos apps

1. Criar o app `dev` na DigitalOcean App Platform usando `.do/app.dev.yaml` como base.
2. Criar o app `prod` na DigitalOcean App Platform usando `.do/app.prod.yaml` como base.
3. Anotar o `App ID` de cada ambiente.
4. Preencher os GitHub Environments `dev` e `prod`.
5. Rodar o workflow `deploy-digitalocean` manualmente ou fazer push em `develop` e `main`.

## Comandos úteis

```bash
# gerar segredo JWT
openssl rand -base64 64

# criar app dev via doctl
APP_NAME=mesa-conecta-dev \
APP_BRANCH=develop \
APP_ENV=dev \
APP_REGION=nyc \
NODE_ENV_VALUE=development \
VITE_APP_URL=https://mesa-conecta-dev.example.com \
VITE_SUPABASE_URL=https://xqjiizwtfavpvxytqzvv.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=replace_with_publishable_key \
DATABASE_URL=replace_with_database_url \
SUPABASE_URL=https://xqjiizwtfavpvxytqzvv.supabase.co \
SUPABASE_ANON_KEY=replace_with_anon_key \
SUPABASE_SERVICE_ROLE_KEY=replace_with_service_role \
JWT_SECRET=replace_with_jwt_secret \
bash scripts/do-app-apply.sh dev create

# atualizar app prod via doctl
DO_APP_ID=replace_with_prod_app_id \
APP_NAME=mesa-conecta-prod \
APP_BRANCH=main \
APP_ENV=prod \
APP_REGION=nyc \
NODE_ENV_VALUE=production \
VITE_APP_URL=https://mesa-conecta-prod.example.com \
VITE_SUPABASE_URL=https://xqjiizwtfavpvxytqzvv.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=replace_with_publishable_key \
DATABASE_URL=replace_with_database_url \
SUPABASE_URL=https://xqjiizwtfavpvxytqzvv.supabase.co \
SUPABASE_ANON_KEY=replace_with_anon_key \
SUPABASE_SERVICE_ROLE_KEY=replace_with_service_role \
JWT_SECRET=replace_with_jwt_secret \
bash scripts/do-app-apply.sh prod update

# validar um spec gerado localmente
doctl apps spec validate /tmp/do-app-spec.yaml

# listar apps
doctl apps list

# inspecionar deploys de um app
doctl apps list-deployments "$DO_APP_ID"
```

## Regras operacionais

1. Não commitar secrets no spec da DigitalOcean.
2. `dev` e `prod` devem usar `App IDs` diferentes.
3. O frontend deve apontar para `/api`, não para uma URL fixa externa.
4. Qualquer mudança nos arquivos `.do/*.yaml` deve ser promovida via workflow.
