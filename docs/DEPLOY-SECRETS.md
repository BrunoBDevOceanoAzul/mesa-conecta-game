# GitHub Secrets e Variáveis — Deploy Separado

Este projeto usa **deploy separado**:
- **Frontend** → Netlify (`https://legendary-sunburst-66154f.netlify.app`)
- **Backend** → Render (`https://mesa-api-xscg.onrender.com`)

## Secrets (Settings > Secrets and variables > Actions > Secrets)

| Nome | Descrição | Onde obter |
|------|-----------|------------|
| `NETLIFY_AUTH_TOKEN` | Token de API do Netlify para deploy automatizado | [Netlify User Settings > Applications > Personal Access Tokens](https://app.netlify.com/user/applications/personal) |
| `NETLIFY_SITE_ID` | ID do site no Netlify | Dashboard do site > Settings > General > Site details > Site ID |
| `RENDER_DEPLOY_HOOK` | URL do deploy hook do Render | Render Dashboard > Settings > Deploy Hooks |
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Supabase Dashboard > Settings > API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase (apenas backend) | Supabase Dashboard > Settings > API |

## Variáveis (Settings > Secrets and variables > Actions > Variables)

| Nome | Valor de exemplo | Descrição |
|------|------------------|-----------|
| `VITE_APP_URL` | `https://legendary-sunburst-66154f.netlify.app` | URL pública do frontend |
| `VITE_MESA_API_URL` | `https://mesa-api-xscg.onrender.com` | URL pública da API |

## Workflows

- **Frontend**: `.github/workflows/deploy-frontend.yml`
  - Dispara em push para `main`, `develop` ou `frontend-*`
  - Apenas quando arquivos em `src/`, `public/`, `vite.config.ts`, etc. mudam
  - Builda com Vite e deploya para Netlify

- **Backend**: `.github/workflows/deploy-backend.yml`
  - Dispara em push para `main`, `develop` ou `api-*`
  - Apenas quando arquivos em `apps/mesa-api/` mudam
  - Roda typecheck, testes e dispara deploy no Render via hook

## Primeiro setup

1. Configure todos os Secrets e Variables acima no GitHub
2. Faça push para a branch `frontend-gitops-mesa-baseline`
3. Os workflows aparecerão na aba Actions
4. Cada mudança futura dispara apenas o deploy relevante
