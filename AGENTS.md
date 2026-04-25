# AGENTS.md

## Objetivo Deste Arquivo

Este arquivo e a memória operacional principal do projeto. Ele existe para registrar contexto duradouro, decisões de arquitetura, convenções obrigatórias, prioridades de implementação e o ponto exato de retomada do trabalho.

A intenção e simples:

- evitar perda de contexto entre sessões
- impedir reabertura das mesmas decisões
- manter produto, banco e backend alinhados
- registrar o que foi decidido e o que ainda falta

Este arquivo deve ser atualizado sempre que houver:

- mudança de direção arquitetural
- redefinição de prioridade
- avanço material em algum domínio importante
- mudança na estratégia de banco, auth ou integrações
- nova decisão relevante sobre a API `mesa`

## Contexto Atual Do Projeto

Projeto atual:

- frontend em `Vite + React + TypeScript`
- uso atual de `Supabase` diretamente no frontend
- autenticação já acoplada ao Supabase
- grande volume de consultas diretas a tabelas via `supabase.from(...)`
- schema já existente no Supabase com migrations acumuladas

Diagnóstico atual:

- o frontend concentra regra de negócio demais
- o acesso ao banco está espalhado por páginas, hooks, libs e componentes
- o banco existe, mas o conhecimento sobre ele está distribuído e difícil de manter
- falta uma camada central para autorização, invariantes de negócio e integração externa

## Visão De Arquitetura

### Direção Aprovada

Foi decidido construir um backend separado chamado `mesa`.

Essa API será a camada principal de negócio da plataforma.

O `Supabase` continua como infraestrutura de base para:

- `Postgres`
- `Auth`
- `Storage`

O `Drizzle` será a fonte de verdade do schema versionado em código.

### Forma Da API

A `mesa` deve nascer como um **monólito modular**, não como microserviços.

Motivos:

- reduz custo operacional
- simplifica autenticação e autorização
- facilita migrations e baseline do banco
- mantém deploy e observabilidade mais simples
- permite extração futura de módulos se isso fizer sentido

### Stack Recomendada Da API

Stack-base recomendada:

- `Node.js`
- `TypeScript`
- `Fastify`
- `Drizzle ORM`
- `drizzle-kit`
- `Zod`

### Papel De Cada Camada

Frontend:

- renderização de interface
- consumo de endpoints da API `mesa`
- abandono gradual de acesso direto às tabelas críticas

API `mesa`:

- regra de negócio
- autorização
- contratos HTTP
- orquestração com Supabase/Auth/Storage
- integrações externas
- centralização de transações e invariantes

Supabase:

- banco PostgreSQL remoto
- autenticação
- armazenamento de arquivos

Drizzle:

- modelagem de schema
- tipagem central do banco
- geração e revisão de migrations
- baseline e evolução controlada do banco

## Banco De Dados

### Estado Desejado

O banco remoto do Supabase deve continuar sendo o banco oficial da aplicação, mas sua evolução deve passar a ser controlada por código via Drizzle.

### Regra Principal

O schema da aplicação não deve mais ficar espalhado entre:

- tipos gerados automaticamente
- migrations antigas sem curadoria
- consultas implícitas no frontend
- comportamento inferido da UI

O schema oficial da aplicação deve ficar centralizado no código da `mesa`.

### Estratégia De Banco

A estratégia aprovada e:

1. inventariar o schema atual do Supabase
2. cruzar o schema com o uso real do frontend
3. consolidar entidades, relações e dependências
4. representar o banco em Drizzle
5. estabelecer uma baseline compatível com o banco remoto atual
6. fazer toda mudança futura por migration revisada

### Separação Conceitual Do Banco

Tratar o banco em tres camadas:

- `auth schema`
  mantido pelo Supabase Auth
- `application schema`
  controlado pela `mesa` via Drizzle
- `storage contracts`
  buckets, paths e regras de uso documentadas e controladas pela aplicação

## Estratégia De Migração

### Princípio

Nao migrar tudo de uma vez.

O frontend pode conviver temporariamente com dois caminhos:

- consumo direto do Supabase em áreas ainda não migradas
- consumo da API `mesa` em fluxos já promovidos

### Regra De Migração Por Domínio

Para cada domínio:

1. mapear uso atual no frontend
2. modelar schema e contratos na `mesa`
3. criar endpoints da API
4. trocar o frontend para consumir a API
5. remover o acesso direto ao banco naquele fluxo

### Objetivo Da Migração

- reduzir acoplamento do frontend ao banco
- tirar regras críticas do cliente
- centralizar segurança e autorização
- tornar manutenção previsível

## Módulos Da API `mesa`

Os módulos aprovados para a primeira arquitetura são:

- `auth`
  valida token do Supabase, resolve usuário atual, papel e permissões
- `profiles`
  perfil base, onboarding, preferências, avatar, perfis públicos e dados ligados à conta
- `mesas`
  criação, edição, descoberta, detalhe, participantes, agenda e disponibilidade
- `bookings`
  reservas, cancelamentos, fila de espera, histórico e regras de elegibilidade
- `billing`
  produtos, planos, trial, assinaturas, cupons, wallet/créditos e integração Asaas
- `social`
  feed, posts, comentários, likes, favoritos e compartilhamentos
- `chat`
  conversas, mensagens, participantes e notificações relacionadas à conversa
- `reviews`
  reviews, reputação, feedback de sessão e pendências de avaliação
- `session`
  assets, cues, soundboard, rolagem de dados, preparação e fichas
- `admin`
  catálogo, CMS, campanhas, tickets, auditoria e operação interna
- `analytics`
  eventos, atribuição, boost, métricas operacionais e relatórios

## Prioridade De Implementação

### P0 - Fundação

- criar a API `mesa`
- definir estrutura modular
- configurar ambiente, logging e tratamento de erro
- configurar autenticação com JWT do Supabase
- integrar Drizzle e `drizzle-kit`
- mapear schema atual do banco
- estabelecer baseline do banco remoto
- definir DTOs e convenções de resposta
- criar healthcheck e observabilidade básica

### P1 - Identidade E Perfil

- `auth`
- `profiles`
- `onboarding`
- preferências
- privilégios
- perfis públicos

### P2 - Núcleo Operacional

- `mesas`
- `bookings`
- participantes
- agenda
- disponibilidade
- favoritos
- descoberta e detalhe das mesas

### P3 - Monetização

- `billing`
- produtos
- trial
- assinatura
- checkout
- wallet/créditos
- cupons
- integração Asaas

### P4 - Comunidade E Retenção

- notificações
- feed
- posts
- comentários
- likes
- chat
- reviews

### P5 - Recursos Avançados

- preparação de sessão
- character sheets
- assets de sessão
- cues
- soundboard
- boost
- analytics especializados

### P6 - Backoffice

- admin
- CMS
- campanhas
- catálogo
- tickets
- dashboards internos

## Mapeamento Funcional Atual Do Produto

Com base nas rotas, hooks e integrações já existentes, o sistema atual cobre estes domínios:

- identidade e acesso
- perfil e onboarding
- descoberta e conversão
- operação de mesas
- reservas e agenda
- experiência ao vivo
- preparação e fichas
- social e conteúdo
- reviews e qualidade
- comercial e billing
- growth e analytics
- backoffice
- marca e loja

Resumo prático:

- o produto já é funcionalmente amplo
- a primeira fase da API nao deve tentar cobrir tudo
- a ordem de entrega deve seguir risco, permissão e impacto de negócio

## Regras Arquiteturais Obrigatórias

### Regra 1

O frontend nao deve continuar crescendo com acesso direto a tabelas críticas.

### Regra 2

Toda regra de negócio sensível deve viver na API `mesa`, não em hooks ou componentes.

### Regra 3

Mudanças de schema devem ser feitas de forma versionada e revisada via Drizzle.

### Regra 4

Permissões e autorização devem ser avaliadas no backend, mesmo que exista proteção adicional no banco.

### Regra 5

A migração do frontend deve ser incremental por domínio, nunca uma reescrita total em big bang.

### Regra 6

O projeto deve preservar rastreabilidade entre:

- entidade de negócio
- schema Drizzle
- endpoint da API
- uso no frontend

### Regra 7

O trabalho deve ser separado por branches de domínio:

- `frontend-*` para UI e integração cliente
- `api-*` para a API `mesa`
- `db-*` para Supabase, Drizzle e migrations
- `infra-*` para Docker, Kubernetes, Argo CD e pipelines
- `hotfix-*` para correções urgentes

Branches de feature devem abrir PR para `develop` por padrão. Promoção de produção deve acontecer via PR de `develop` para `main`.

## Estrutura Esperada Do Repositório

Estrutura alvo recomendada, sujeita a refinamento:

```text
/
  AGENTS.md
  src/                     # frontend atual
  supabase/                # config e legado/migrations existentes
  apps/
    mesa-api/
      src/
        modules/
          auth/
          profiles/
          mesas/
          bookings/
          billing/
          social/
          chat/
          reviews/
          session/
          admin/
          analytics/
        db/
          schema/
          migrations/
        plugins/
        lib/
        app.ts
        server.ts
      package.json
```

Observação:

- a nomenclatura final pode variar
- a identidade da API deve permanecer `mesa`

## Decisões Já Tomadas

Estas decisões já foram aprovadas e não devem ser reabertas sem motivo forte:

- haverá um backend separado chamado `mesa`
- a API será um monólito modular inicialmente
- o banco remoto seguirá no Supabase
- o Drizzle será a fonte de verdade do schema
- a migração do frontend será gradual
- este `AGENTS.md` será a memória principal e única de continuidade
- a branch de integração será `develop`
- a branch `main` deve representar produção ou estado pronto para produção
- PRs de trabalho devem apontar para `develop`

## Estado Git E PR Atual

Estado mais recente registrado:

- branch local/remota atual: `frontend-gitops-mesa-baseline`
- branch de integração criada no remoto: `develop`
- PR aberta: `#1`
- URL da PR: `https://github.com/BrunoBDevOceanoAzul/mesa-conecta-game/pull/1`
- título da PR: `[codex] Add mesa API and GitOps baseline`
- estado da PR: draft
- base da PR: `develop`
- head da PR: `frontend-gitops-mesa-baseline`
- commit principal publicado: `1447a1e1fa5df4db05b8373d769573926053b406`

Conceito de branches aprovado:

- `frontend-*` para UI e integração cliente
- `api-*` para API `mesa`
- `db-*` para Supabase, Drizzle e migrations
- `infra-*` para Docker, Kubernetes, Argo CD e pipelines
- `hotfix-*` para correções urgentes

Fluxo esperado:

1. trabalhar em branch de domínio
2. abrir PR para `develop`
3. validar CI e revisão
4. integrar em `develop`
5. promover `develop` para `main` quando houver release

## GitOps E Infra Implementados

Foi criado um baseline GitOps com foco em tecnologias abertas e manutenção declarativa.

Arquivos e áreas principais:

- `Dockerfile`
  multi-stage build com `node:22.16.0-alpine` e `nginx:1.27.4-alpine`
- `nginx.conf`
  entrega do frontend estático com rota `/healthz`
- `.dockerignore`
  exclusões para build de imagem
- `.github/workflows/ci-cd.yml`
  CI/CD com build, testes, validação Kustomize e publicação de imagem
- `k8s/manifests/`
  manifests base declarativos
- `k8s/overlays/staging/`
  overlay Kustomize de staging
- `k8s/overlays/production/`
  overlay Kustomize de produção
- `k8s/manifests/argocd-application.yaml`
  aplicação declarativa para Argo CD
- `scripts/gitops-bootstrap.sh`
  automação inicial de bootstrap GitOps
- `scripts/gitops-rollback.sh`
  rollback operacional
- `scripts/seal-mesa-web-secrets.sh`
  preparação de secrets com Sealed Secrets
- `docs/gitops/README.md`
  documentação operacional GitOps
- `docs/gitops/branching-strategy.md`
  estratégia de branches e promoção

Ferramentas open source assumidas no desenho:

- Docker/OCI image build
- Kubernetes
- Kustomize
- Argo CD
- Sealed Secrets
- Prometheus Operator via `ServiceMonitor` e `PrometheusRule`

## API `mesa` Criada

Foi criada a estrutura inicial em `apps/mesa-api`.

Stack instalada/configurada:

- `Fastify`
- `TypeScript`
- `Drizzle ORM`
- `drizzle-kit`
- `postgres-js`
- `Zod`

Arquivos principais:

- `apps/mesa-api/package.json`
- `apps/mesa-api/drizzle.config.ts`
- `apps/mesa-api/.env.example`
- `apps/mesa-api/src/app.ts`
- `apps/mesa-api/src/server.ts`
- `apps/mesa-api/src/lib/env.ts`
- `apps/mesa-api/src/db/client.ts`
- `apps/mesa-api/src/db/schema/.gitkeep`

Configuração importante:

- o client Postgres usa `prepare: false` por compatibilidade com Supabase pooler em transaction mode
- `.env` real não deve ser versionado
- `DATABASE_URL` deve vir de secret/ambiente

## Supabase E Banco Remoto

Projeto Supabase oficial confirmado:

- project ref: `xqjiizwtfavpvxytqzvv`

Estado do banco remoto:

- as migrations existentes em `supabase/migrations` foram aplicadas no projeto remoto correto
- o comando usado foi `supabase db push --db-url ...`
- o schema `public` remoto ficou provisionado com `110` tabelas
- amostras validadas incluem `admin_actions`, `admin_settings`, `asaas_accounts`, `billing_products`, `bookings` e `boost_campaigns`

Estado do Drizzle:

- a introspecção automática detectou `110` tabelas, `5` enums e `339` policies
- a geração automática do schema não resultou em arquivos úteis nesta combinação de CLI/projeto
- arquivos vazios gerados por tentativa de introspecção foram removidos
- o próximo passo correto é curadoria manual do schema por domínio, não insistir em introspecção automática sem diagnóstico novo

Regra de segurança:

- senha e URL completa do banco não devem ser documentadas neste arquivo
- usar `.env` local ignorado e secrets no CI/CD/cluster

## Skills E Ferramentas Instaladas

Foi instalado o pacote de skills Supabase:

```bash
npx skills add supabase/agent-skills --yes --global
```

Skills instaladas localmente:

- `~/.agents/skills/supabase`
- `~/.agents/skills/supabase-postgres-best-practices`

Observação:

- após reiniciar o Codex/CLI, essas skills devem aparecer automaticamente na lista de skills disponíveis
- em qualquer tarefa envolvendo Supabase, banco, RLS, migrations ou Postgres, usar a skill `supabase`
- em modelagem e otimização de Postgres, usar também `supabase-postgres-best-practices`

## Manifesto Local De MCPs E Skills

Foi criado um manifesto local na raiz do projeto:

- `.mcp.json`

Objetivo:

- centralizar os MCPs e skills operacionais esperados para este projeto
- registrar de forma estável quais integrações devem ser usadas nas sessões
- separar contexto operacional de credenciais reais

Entradas registradas no manifesto:

- MCPs: `render`, `supabase`, `netlify`, `vite`, `pencil`, `google-auth`
- Skills: `skill-superpower-de-prompt`, `skill-de-projeto-otimizacao-de-tarefas`

Regras:

- o arquivo nao armazena secrets
- credenciais continuam em `.env`, dashboards e secrets do CI/CD
- nomes das integrações devem permanecer estáveis para evitar ambiguidade operacional

## Validações Mais Recentes

Validações que passaram:

- `NPM_CONFIG_CACHE=/tmp/mesa-npm-cache npm --prefix apps/mesa-api run typecheck`
- `npm run build`
- `npm test`
- `kubectl kustomize k8s/overlays/production`
- `kubectl kustomize k8s/overlays/staging`

Resultado conhecido do build:

- o build do Vite passou
- houve warning de chunk grande acima de `500 kB`, não bloqueante

Pendência conhecida:

- `npm run lint` ainda falha por dívida técnica preexistente
- último registro: `429` errors e `50` warnings
- principais causas: `@typescript-eslint/no-explicit-any`, dependências de hooks e padrões antigos em código existente
- o workflow CI/CD trata lint como auditoria não bloqueante por enquanto (`continue-on-error`)
- testes, build e Kustomize seguem como validações bloqueantes

## O Que Foi Executado Nesta Sessão

### API Mesa — Endpoints Auth/Profiles

Foram criados os primeiros endpoints REST da API:

- `GET /auth/me` — retorna perfil completo do usuário autenticado (inclui stats de GM, player profile, roles)
- `GET /profiles/:id` — retorna perfil público (sanitizado, respeita `isPublic`)
- `PUT /profiles/me` — atualiza perfil do usuário autenticado com validação Zod

Arquivos:

- `apps/mesa-api/src/modules/profiles/routes.ts`
- `apps/mesa-api/src/modules/profiles/schemas.ts`

### Schemas Drizzle Expandidos

- `apps/mesa-api/src/db/schema/mesas.ts` — tabelas `mesas`, `mesa_views`, `mesa_popularity_scores`, `mesa_boosts`
- `apps/mesa-api/src/db/schema/events.ts` — tabela `events` para tracking comportamental

### Eventos e Recomendações

- `POST /events` — coleta eventos comportamentais do frontend
- `GET /mesas/recomendadas` — algoritmo de scoring v1 com pesos (proximidade, preferências, qualidade GM, popularidade, frescor, boost)

### Cliente Frontend da API

- `src/lib/api.ts` — cliente HTTP com `fetchWithAuth`, intercepta token Supabase automaticamente
- Inclui `eventsApi`, `recommendationsApi`, `healthApi`

### Autenticação JWT

- Plugin `authPlugin` verifica token via Supabase Auth API (`/auth/v1/user`)
- Fallback para parse local do payload quando Supabase não está configurado (apenas dev)
- Adicionado `JWT_SECRET` ao schema de env para assinatura/verificação de JWTs internos no futuro

### Hospedagem DigitalOcean — Direção Atual

Foi aprovada a substituição do deploy `Netlify + Render` por `DigitalOcean App Platform` com dois ambientes:

- **dev** → app dedicado ligado à branch `develop`
- **prod** → app dedicado ligado à branch `main`

Cada ambiente usa um app único com dois componentes:

- `mesa-web` como `static_site`
- `mesa-api` como `service`

Roteamento aprovado:

- frontend no path `/`
- API no path `/api`

### GitHub Actions — Deploy DigitalOcean

O caminho ativo de deploy agora é um workflow único:

1. `.github/workflows/deploy-digitalocean.yml`
   - Dispara em push para `develop` e `main`
   - Faz build do frontend
   - Roda typecheck e testes da API
   - Renderiza o spec da DigitalOcean a partir de `.do/app.dev.yaml` ou `.do/app.prod.yaml`
   - Valida com `doctl apps spec validate`
   - Executa `doctl apps update --spec ... --wait`

### Scripts e Documentação

- `scripts/build-unified.sh` — script de build que auto-detecta raiz do projeto (funciona tanto da raiz quanto de `apps/mesa-api`)
- `scripts/render-do-app-spec.sh` — renderiza o spec da DigitalOcean com vars/secrets sem commitar credenciais
- `.do/app.dev.yaml` — template declarativo do ambiente dev
- `.do/app.prod.yaml` — template declarativo do ambiente prod
- `docs/ENVIRONMENT-VARIABLES.md` — checklist completo de vars/secrets para DigitalOcean + GitHub Environments
- `docs/DEPLOY-SECRETS.md` — referência rápida para o setup dos environments `dev` e `prod`

### MCP Local Do Frontend Vite

Foi integrada a dependência `vite-plugin-mcp` ao frontend para expor contexto MCP durante desenvolvimento local.

Arquivos afetados:

- `package.json`
- `package-lock.json`
- `vite.config.ts`

Configuração adotada:

- o plugin `ViteMcp` roda apenas em `development`
- `updateConfig: false` foi definido para impedir escrita automática de arquivos MCP no projeto ou no home
- o endpoint MCP do frontend fica disponível no dev server local em `http://localhost:8080/__mcp/sse`

Uso operacional:

- este MCP e local ao ambiente de desenvolvimento
- clientes locais, como OpenCode Terminal, devem apontar para a URL SSE do Vite quando o `npm run dev` estiver ativo
- nenhuma configuração local de MCP do usuário deve ser commitada no repositório

### Estado Do Banco Remoto

- Projeto Supabase: `xqjiizwtfavpvxytqzvv`
- `110` tabelas no schema `public`
- Tabela `mesas` já existe no banco (criada via migrations antigas do Supabase)
- As novas tabelas do schema Drizzle (`events`, `mesa_views`, etc.) ainda **não foram criadas** no banco remoto — são usadas apenas no código por enquanto
- A estratégia é curar o schema por domínio e depois gerar migrations formais

## O Que Ainda Não Foi Executado

### Configuração De Ambiente (Pendente Manual)

**GitLab CI/CD Variables (14/15 configuradas):**
- [x] Secret `DATABASE_URL` (não-masked devido a caracteres especiais na URL)
- [x] Secret `SUPABASE_URL`
- [x] Secret `SUPABASE_ANON_KEY`
- [x] Secret `SUPABASE_SERVICE_ROLE_KEY`
- [x] Secret `JWT_SECRET`
- [x] Secret `SENDGRID_API_KEY`
- [x] Secret `KUBECONFIG_DEV` (base64, masked)
- [x] Secret `KUBECONFIG_HOMOLOG` (base64, masked)
- [x] Secret `KUBECONFIG_PROD` (base64, masked)
- [x] Secret `VITE_SUPABASE_URL`
- [x] Secret `VITE_SUPABASE_PUBLISHABLE_KEY`
- [x] Variable `VITE_APP_URL` (dinâmica por branch: dev/homolog/prod)
- [x] Variable `DOCKER_DRIVER` (overlay2)
- [x] Variable `DOCKER_TLS_CERTDIR` ("")
- [x] Variable `DOCKER_BUILDKIT` (1)
- [x] Secret `DEPLOY_TOKEN` (via GitLab Registry, automático)

**Cluster Kubernetes:**
- [x] Criar `imagePullSecret` `gitlab-registry` nos 3 namespaces
- [x] Verificar Sealed Secrets aplicados em todos os namespaces
- [x] Ajustar username do deploy token (placeholder: `gitlab-deploy-token`)

**Docker Driver (GitLab Shared Runners):**
- [x] Configurar `DOCKER_DRIVER: overlay2` (obrigatório para DinD)
- [x] Configurar `DOCKER_TLS_CERTDIR: ""` (desabilita TLS interno)
- [x] Configurar `DOCKER_BUILDKIT: "1"` (builds otimizadas)

### Desenvolvimento De Domínio

- [x] Frontend consumir `GET /auth/me` ao invés de `supabase.from("profiles")`
- [x] Frontend consumir `PUT /profiles/me` ao invés de `supabase.from("profiles").update()`
- [x] Tela de perfil do membro integrada com API (EditProfile.tsx usa profilesApi)
- [x] Curadoria Drizzle de `bookings`, `billing`, `social`, `reviews` — schemas criados
- [ ] Migrations formais das novas tabelas no banco remoto
- [x] Remover dependências de `src/data/mock.ts` — substituído por `src/data/constants.ts`

## URLs E Recursos Importantes

| Recurso | URL |
|---------|-----|
| DigitalOcean Kubernetes | `https://cloud.digitalocean.com/kubernetes/clusters` |
| Dev App | `https://dev.sociodotabuleiro.app.br` |
| Homolog App | `https://homolog.sociodotabuleiro.app.br` |
| Prod App | `https://sociodotabuleiro.app.br` |
| API Health | `https://dev.sociodotabuleiro.app.br/api/health` |
| Supabase Project | `https://supabase.com/dashboard/project/xqjiizwtfavpvxytqzvv` |
| GitHub PR #1 | `https://github.com/BrunoBDevOceanoAzul/mesa-conecta-game/pull/1` |
| GitLab Project | `https://gitlab.com/socio-do-tabuleiro/socio-do-tabuleiro` |

## Próximos Passos Aprovados

1. **Aguardar pipeline** do GitLab rodar e validar deploy no dev
2. **Promover para homolog** e testar fluxo completo
3. **Seguir curadoria Drizzle** — `bookings`, `billing`, `social`, `reviews`

## Ponto Atual De Retomada

- Branch atual: `frontend-gitops-mesa-baseline`
- Código pushado para **GitLab** (origin) e GitHub (github)
- **Infraestrutura: DOKS (Kubernetes)**
  - Cluster `mesa-cluster` em nyc1 com 2 nodes
  - Ingress-Nginx, Cert-Manager, Sealed Secrets instalados
  - Namespaces: `mesa-dev`, `mesa-homolog`, `mesa-prod`
  - DNS Cloudflare configurado: dev, homolog, prod, *.sociodotabuleiro.app.br
- **CI/CD: GitLab CI** (pipeline ativa)
  - `.gitlab-ci.yml` com stages: validate → build → scan → deploy → notify
  - Deploy automático dev/homolog, manual para prod
  - Docker driver: `overlay2` + `DOCKER_TLS_CERTDIR=""` + `DOCKER_BUILDKIT=1`
  - `VITE_APP_URL` dinâmico por branch (dev/homolog/prod)
  - Variáveis configuradas no GitLab (15/15 completas)
  - `imagePullSecret` criado nos 3 namespaces
- **Segurança:** Corrigido vazamento de dados sensíveis (email, phone, whatsapp, ipHash, userAgent) nos JSON responses
- **Clean Architecture implementada:**
  - Auth (VerifyTokenUseCase + SupabaseAuthRepository)
  - Profiles (GetMyProfile, GetPublicProfile, UpdateProfile)
  - Events (CreateEventUseCase)
  - Recommendations (GetRecommendationsUseCase + algoritmo scoring v1)
- **Testes: 26 passando** (9 arquivos de teste, Vitest)
- Manifestos K8s com imagePullSecret para GitLab Registry
- Schema Drizzle curado: `auth/profiles`, `mesas`, `events`, `reviews`, `bookings`, `billing`, `social`
- **Frontend integrado com API:**
  - `EditProfile.tsx` consome `GET /auth/me` e `PUT /profiles/me`
  - `profilesApi` em `src/lib/api.ts` com mapeamento camelCase/snake_case
  - `src/data/mock.ts` removido — substituído por `src/data/constants.ts`
- `AGENTS.md` não deve ser commitado — manter local apenas

### Comando Útil Para Retomar

```bash
# Verificar estado do repositório
git status
git log --oneline -5

# Verificar se branch está sincronizada
git fetch origin
git status

# Rodar validações locais
NPM_CONFIG_CACHE=/tmp/mesa-npm-cache npm --prefix apps/mesa-api run verify
npm run build
npm test

# Disparar deploy do backend
curl -X POST "https://api.render.com/deploy/srv-d7knpg68bjmc73dbc4u0?key=FWw6gbTKThE"

# Verificar endpoints online
curl https://mesa-api-xscg.onrender.com/health
curl -s -o /dev/null -w '%{http_code}' https://mesa-api-xscg.onrender.com/auth/me  # Esperado: 401
```

## Como Usar Este Arquivo Em Sessões Futuras

Ao retomar o trabalho:

1. ler este arquivo primeiro
2. validar se o estado atual do repositório ainda corresponde a este documento
3. atualizar a seção de `Próximos Passos Aprovados` se algo foi executado
4. atualizar `Ponto Atual De Retomada`
5. registrar qualquer decisão nova antes de mudar a direção

Se houver conflito entre o código e este documento:

- o conflito deve ser explicitado
- a divergência deve ser resolvida conscientemente
- este arquivo deve ser atualizado
