# Variáveis de Ambiente — Configuração Completa

> **ATENÇÃO**: Este arquivo é documentação. NUNCA coloque valores reais aqui. Use `.env` local e configure secrets nos painéis de hospedagem.

---

## 1. BACKEND — Render (API Mesa)

**URL do serviço:** `https://mesa-api-xscg.onrender.com`
**Dashboard:** `https://dashboard.render.com/web/srv-d7knpg68bjmc73dbc4u0`

### Environment Variables (Render Dashboard > Settings > Environment)

| Variável | Obrigatória | Descrição | Como obter |
|----------|-------------|-----------|------------|
| `DATABASE_URL` | **Sim** | Connection string do PostgreSQL (Supabase pooler) | Supabase Dashboard > Settings > Database > Connection String > URI (transaction pooler) |
| `SUPABASE_URL` | **Sim** | URL do projeto Supabase | Supabase Dashboard > Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | **Sim** | Chave pública (publishable) do Supabase | Supabase Dashboard > Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sim** | Chave de serviço (bypass RLS) | Supabase Dashboard > Settings > API > service_role secret |
| `JWT_SECRET` | **Sim** | Chave secreta para assinar/verificar JWTs internos | `openssl rand -base64 64` (guarde em cofre) |
| `DEPLOY_TOKEN` | Não | Token de deploy (se usar webhook customizado) | Gerado manualmente ou fornecido por integração |
| `PORT` | Não | Porta do servidor | Padrão: `8787` |
| `NODE_ENV` | Não | Ambiente Node.js | `production` no Render |

### Build Settings (Render Dashboard > Settings)

| Campo | Valor |
|-------|-------|
| **Root Directory** | `apps/mesa-api` |
| **Build Command** | `bash ../../scripts/build-unified.sh` |
| **Start Command** | `npm start` |

---

## 2. FRONTEND — Netlify (React App)

**URL do site:** `https://legendary-sunburst-66154f.netlify.app`
**Site ID:** `82405415-9a89-4042-8cc5-ddafb5058c00`

### Environment Variables (Netlify Dashboard > Site Settings > Environment Variables)

| Variável | Obrigatória | Descrição | Como obter |
|----------|-------------|-----------|------------|
| `VITE_SUPABASE_URL` | **Sim** | URL do projeto Supabase | Supabase Dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Sim** | Chave pública do Supabase (cliente browser) | Supabase Dashboard > Settings > API > anon public |
| `VITE_MESA_API_URL` | **Sim** | URL da API Mesa no Render | `https://mesa-api-xscg.onrender.com` |
| `VITE_APP_URL` | Não | URL pública do próprio frontend | `https://legendary-sunburst-66154f.netlify.app` |
| `VITE_ENV` | Não | Ambiente da aplicação | `production` no Netlify |

### Build Settings (Netlify Dashboard > Site Settings > Build & Deploy)

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm run build` |
| **Publish Directory** | `dist` |

---

## 3. GITHUB ACTIONS — Secrets e Variáveis

### Secrets (GitHub > Settings > Secrets and Variables > Actions > New Repository Secret)

| Nome | Obrigatória | Descrição | Como obter |
|------|-------------|-----------|------------|
| `NETLIFY_AUTH_TOKEN` | **Sim** | Personal access token do Netlify para deploy via CLI | [Netlify User Settings > Applications > Personal Access Tokens](https://app.netlify.com/user/applications/personal) |
| `NETLIFY_SITE_ID` | **Sim** | ID do site no Netlify | Netlify Dashboard > Site Settings > General > Site Details > Site ID |
| `RENDER_DEPLOY_HOOK` | **Sim** | URL do deploy hook do Render | Render Dashboard > Settings > Deploy Hooks > Create Hook |
| `VITE_SUPABASE_URL` | **Sim** | URL do Supabase (mesmo valor do frontend) | Supabase Dashboard |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Sim** | Chave pública do Supabase | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sim** | Chave de serviço do Supabase (usada apenas no backend) | Supabase Dashboard > Settings > API > service_role secret |
| `DATABASE_URL` | **Sim** | Connection string PostgreSQL (usada apenas no backend) | Supabase Dashboard |

### Variáveis (GitHub > Settings > Secrets and Variables > Actions > Variables)

| Nome | Obrigatória | Valor de exemplo | Descrição |
|------|-------------|------------------|-----------|
| `VITE_APP_URL` | Não | `https://legendary-sunburst-66154f.netlify.app` | URL pública do frontend |
| `VITE_MESA_API_URL` | Não | `https://mesa-api-xscg.onrender.com` | URL pública da API |

---

## 4. SUPABASE — Configuração do Projeto

**Project Ref:** `xqjiizwtfavpvxytqzvv`
**Dashboard:** `https://supabase.com/dashboard/project/xqjiizwtfavpvxytqzvv`

### Dados do projeto (para referência, não são secrets)

| Dado | Valor/Descrição |
|------|----------------|
| **Project URL** | `https://xqjiizwtfavpvxytqzvv.supabase.co` |
| **Pooler Host** | `aws-1-us-west-2.pooler.supabase.com` |
| **Pooler Port** | `6543` (transaction mode) |
| **Database Password** | Definida na criação do projeto — **nunca compartilhar** |

---

## 5. CHECKLIST DE CONFIGURAÇÃO

### Render (Backend)

- [ ] `DATABASE_URL` configurado com pooler Supabase (transaction mode, port 6543)
- [ ] `SUPABASE_URL` configurado
- [ ] `SUPABASE_ANON_KEY` configurado
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurado
- [ ] `JWT_SECRET` gerado com `openssl rand -base64 64` e configurado
- [ ] `NODE_ENV=production` configurado
- [ ] Build Command: `bash ../../scripts/build-unified.sh`
- [ ] Start Command: `npm start`
- [ ] Root Directory: `apps/mesa-api`

### Netlify (Frontend)

- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` configurado
- [ ] `VITE_MESA_API_URL=https://mesa-api-xscg.onrender.com` configurado
- [ ] `VITE_APP_URL` configurado com URL do Netlify
- [ ] Build Command: `npm run build`
- [ ] Publish Directory: `dist`

### GitHub (CI/CD)

- [ ] Secret `NETLIFY_AUTH_TOKEN` criado
- [ ] Secret `NETLIFY_SITE_ID` criado
- [ ] Secret `RENDER_DEPLOY_HOOK` criado
- [ ] Secret `VITE_SUPABASE_URL` criado
- [ ] Secret `VITE_SUPABASE_PUBLISHABLE_KEY` criado
- [ ] Secret `SUPABASE_SERVICE_ROLE_KEY` criado
- [ ] Secret `DATABASE_URL` criado
- [ ] Variable `VITE_APP_URL` criada
- [ ] Variable `VITE_MESA_API_URL` criada

---

## 6. COMANDOS ÚTEIS

```bash
# Gerar JWT_SECRET seguro
openssl rand -base64 64

# Testar health da API
curl https://mesa-api-xscg.onrender.com/health

# Testar auth (deve retornar 401 sem token)
curl https://mesa-api-xscg.onrender.com/auth/me

# Verificar variáveis no Render (via CLI, se instalado)
render env list --service srv-d7knpg68bjmc73dbc4u0
```

---

## 7. REGRAS DE SEGURANÇA

1. **NUNCA** commitar `.env` ou arquivos com valores reais
2. **NUNCA** expor `SUPABASE_SERVICE_ROLE_KEY` no frontend
3. **NUNCA** expor `JWT_SECRET` em logs ou respostas HTTP
4. **SEMPRE** usar `JWT_SECRET` com no mínimo 32 caracteres
5. **SEMPRE** rotacionar tokens se houver suspeita de vazamento
6. **SEMPRE** usar HTTPS em produção (Render e Netlify já fazem isso)

---

*Documento gerado em: 2026-04-23*
*Atualizar sempre que novas variáveis forem adicionadas*
