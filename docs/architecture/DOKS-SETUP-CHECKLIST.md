# DOKS Setup Checklist

> Documento de configuração manual necessária para ativar o pipeline CI/CD completo.

---

## ✅ O que já está pronto no cluster

| Componente | Status |
|-----------|--------|
| Cluster DOKS `mesa-cluster` (nyc1, 2 nodes) | ✅ Ready |
| Sealed Secrets controller | ✅ Running |
| Ingress-Nginx controller | ✅ Running |
| Cert-Manager + Let's Encrypt | ✅ Ready |
| Namespaces (dev/homolog/prod) | ✅ Created |

**LoadBalancer IP do Ingress:** `206.189.254.26`

---

## 1. DNS Cloudflare (OBRIGATÓRIO)

Acesse https://dash.cloudflare.com → Seu domínio → DNS → Records

Crie estes registros A:

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | `@` | `206.189.254.26` | Proxied |
| A | `www` | `206.189.254.26` | Proxied |
| A | `homolog` | `206.189.254.26` | Proxied |
| A | `dev` | `206.189.254.26` | Proxied (opcional) |

> **Importante:** O "Proxied" (laranja) da Cloudflare é opcional no início. Se ativar, o TLS será gerenciado pela Cloudflare e não precisará do Let's Encrypt. Recomendo começar com "DNS only" (cinza) para testar o cert-manager primeiro.

---

## 2. GitHub Secrets (Repository level)

Vá em: Settings → Secrets and variables → Actions → **New repository secret**

| Secret | Valor |
|--------|-------|
| `SENDGRID_API_KEY` | Criar em https://signup.sendgrid.com/ → Settings → API Keys → Create API Key (Full Access) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (ex: `https://xqjiizwtfavpvxytqzvv.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API → `anon` `public` key |
| `GITHUB_TOKEN` | Automático, não precisa criar |

---

## 3. GitHub Variables (Repository level)

Vá em: Settings → Secrets and variables → Actions → **Variables** tab → New repository variable

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://mesaconecta.com` |

---

## 4. GitHub Environments + Secrets

Vá em: Settings → Environments → **New environment**

Crie 3 environments: `dev`, `homolog`, `prod`

Para **CADA** environment, adicione estes secrets:

### Environment: `dev`

| Secret | Como obter |
|--------|-----------|
| `KUBECONFIG_DEV` | Rode no terminal: `cat ~/.kube/config \| base64 \| pbcopy` e cole |
| `DATABASE_URL` | Connection string do Supabase (postgres://...) |
| `SUPABASE_URL` | Mesmo que NEXT_PUBLIC_SUPABASE_URL |
| `SUPABASE_ANON_KEY` | Mesmo que NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` `secret` key |
| `JWT_SECRET` | Rode: `openssl rand -base64 64` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token (Zone:Read, DNS:Edit) |

### Environment: `homolog`

| Secret | Valor |
|--------|-------|
| `KUBECONFIG_HOMOLOG` | Mesmo kubeconfig (mesmo cluster, base64) |
| `DATABASE_URL` | Mesma connection string (ou uma separada se quiser) |
| `SUPABASE_URL` | Idem |
| `SUPABASE_ANON_KEY` | Idem |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem |
| `JWT_SECRET` | Mesmo JWT_SECRET |
| `CLOUDFLARE_API_TOKEN` | Mesmo token |

### Environment: `prod`

| Secret | Valor |
|--------|-------|
| `KUBECONFIG_PROD` | Mesmo kubeconfig (mesmo cluster, base64) |
| `DATABASE_URL` | **IMPORTANTE:** Use a connection string de produção do Supabase |
| `SUPABASE_URL` | Idem |
| `SUPABASE_ANON_KEY` | Idem |
| `SUPABASE_SERVICE_ROLE_KEY` | Idem |
| `JWT_SECRET` | **IMPORTANTE:** Use um JWT_SECRET diferente do dev/homolog |
| `CLOUDFLARE_API_TOKEN` | Mesmo token |

> **Nota:** Para ambientes separados, idealmente cada um teria seu próprio banco. No momento, como usamos Supabase remoto, todos apontam para o mesmo banco. Isso é aceitável para validação, mas considere criar projetos Supabase separados para homolog/prod no futuro.

---

## 5. Gerar Sealed Secrets reais

Os arquivos `k8s/overlays/*/sealed-secret.yaml` atualmente têm placeholders (`AgA...`). Precisamos gerar os reais.

No terminal local (na raiz do projeto), com as variáveis de ambiente setadas:

```bash
# 1. Certifique-se que o certificado existe
ls sealed-secrets-cert.pem

# 2. Sete as variáveis (substitua pelos valores reais)
export DATABASE_URL="postgres://..."
export SUPABASE_URL="https://..."
export SUPABASE_ANON_KEY="eyJ..."
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
export JWT_SECRET="..."
export CLOUDFLARE_API_TOKEN="..."

# 3. Gere para cada ambiente
./scripts/seal-secrets.sh mesa-dev k8s/overlays/dev/sealed-secret.yaml
./scripts/seal-secrets.sh mesa-homolog k8s/overlays/homolog/sealed-secret.yaml
./scripts/seal-secrets.sh mesa-prod k8s/overlays/prod/sealed-secret.yaml

# 4. Commit e push
git add k8s/overlays/*/sealed-secret.yaml
git commit -m "feat(secrets): add sealed secrets for all environments"
git push
```

---

## 6. Testar deploy manual no Dev

Após configurar os secrets no GitHub, você pode testar fazendo push para `develop`:

```bash
git checkout develop
# faça uma mudança mínima (ex: adicione uma linha em branco em um arquivo)
git add .
git commit -m "test: trigger dev deploy"
git push origin develop
```

Ou dispare manualmente via GitHub Actions:
- Actions → `ci-cd-doks` → Run workflow → Branch: `develop`

---

## 7. Verificar deploy no cluster

```bash
# Ver pods no dev
kubectl get pods -n mesa-dev

# Ver logs do backend
kubectl logs -n mesa-dev -l app.kubernetes.io/name=mesa-api --tail=50

# Ver logs do frontend
kubectl logs -n mesa-dev -l app.kubernetes.io/name=mesa-web --tail=50

# Ver ingress
kubectl get ingress -n mesa-dev

# Ver certificado (pode levar alguns minutos)
kubectl get certificate -n mesa-dev
```

---

## 8. Troubleshooting comum

### "ImagePullBackOff"
- A imagem ainda não foi publicada no GHCR. Verifique se o job `build-push` rodou com sucesso.
- Ou o `imagePullPolicy: IfNotPresent` está pegando uma imagem antiga. Delete o pod para forçar pull.

### "Pending" no certificado
- O DNS ainda não propagou para o domínio
- Verifique: `kubectl describe certificate -n mesa-dev`
- Verifique: `kubectl describe challengerequest -n mesa-dev`

### "502 Bad Gateway"
- O backend não está respondendo no healthcheck
- Verifique logs: `kubectl logs -n mesa-dev deployment/dev-mesa-api`

### Email não chega
- Verifique se `SENDGRID_API_KEY` está configurado nos repository secrets
- Verifique se o domínio `mesaconecta.com` está verificado no SendGrid (sender authentication)

---

## 9. Próximo passo após validação

Quando o deploy no `dev` estiver funcionando:

1. Crie uma PR de `develop` → `homolog`
2. A pipeline vai rodar testes
3. Se passar, faça merge
4. O deploy em homolog vai acontecer automaticamente
5. Você receberá um email de confirmação
6. Teste em https://homolog.mesaconecta.com
7. Crie PR de `homolog` → `main`
8. Após review e merge, deploy em produção

---

## Resumo dos IPs e URLs

| Ambiente | URL | LoadBalancer |
|----------|-----|-------------|
| Dev | (sem DNS, acessar via port-forward) | 206.189.254.26 |
| Homolog | https://homolog.mesaconecta.com | 206.189.254.26 |
| Prod | https://mesaconecta.com | 206.189.254.26 |

---

*Gerado automaticamente em 2026-04-24*
