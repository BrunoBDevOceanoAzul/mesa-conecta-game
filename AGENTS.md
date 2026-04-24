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

## O Que Ainda Nao Foi Executado

Ainda nao foi feito:

- curadoria manual do schema Drizzle por domínio a partir do banco já provisionado
- criação de endpoints de domínio
- migração do frontend
- configuração real dos secrets de CI/CD e cluster
- substituição final dos templates de secrets por valores selados
- conexão operacional do Argo CD com o cluster real

## Próximos Passos Aprovados

Ordem recomendada para a próxima sessão de execução:

1. revisar a PR `#1` e decidir se ela continua como draft ou se será marcada como pronta
2. validar se a branch `frontend-gitops-mesa-baseline` segue limpa e sincronizada
3. transformar o banco provisionado em schema Drizzle útil por domínio
4. iniciar `auth/profiles`
5. seguir para `mesas/bookings`
6. mapear `billing` com cuidado por causa de assinaturas, trial, wallet e Asaas
7. alinhar o frontend para consumir a API `mesa` por módulos
8. configurar secrets reais de CI/CD, registry e cluster quando a infra de deploy for ativada

## Ponto Atual De Retomada

Parada atual:

- PR `#1` aberta em draft de `frontend-gitops-mesa-baseline` para `develop`
- branch `develop` criada no remoto
- baseline GitOps, Docker, K8s, Kustomize e Argo CD versionado
- arquitetura da API `mesa` definida
- estratégia de banco com `Supabase + Drizzle` definida
- módulos da API definidos
- escala de prioridade definida
- `AGENTS.md` consolidado como memória única
- estrutura inicial da API criada em `apps/mesa-api`
- stack base configurada com `Fastify`, `TypeScript`, `Drizzle`, `postgres-js` e `Zod`
- `DATABASE_URL` da API ajustada para o pooler do Supabase com `postgres.<project-ref>` e senha URL-encoded
- `typecheck` da API passando
- projeto Supabase oficial confirmado como `xqjiizwtfavpvxytqzvv`
- as 80 migrations existentes em `supabase/migrations` foram aplicadas com sucesso no banco remoto correto via `supabase db push --db-url ...`
- validação manual confirmou `110` tabelas no schema `public` do projeto correto
- Supabase agent skills instaladas localmente e devem estar disponíveis após reiniciar o Codex/CLI
- validações de API, build, testes e Kustomize passaram
- lint ainda falha por dívida técnica preexistente e foi registrado como pendência conhecida

Observação importante:

- a introspecção automática do `drizzle-kit` contra o banco já provisionado detecta as tabelas e policies, mas nesta versão/combinação de CLI ela não concluiu com geração útil de schema versionado; os arquivos `drizzle/schema.ts` e `drizzle/relations.ts` permaneceram praticamente vazios
- por isso, o próximo passo aprovado deixa de ser “introspectar mais uma vez” e passa a ser “curar o schema Drizzle por domínio a partir do banco já provisionado”

Na próxima retomada, nao reabrir o debate arquitetural do zero.

O próximo trabalho deve começar por:

- confirmar estado da PR `#1`
- gerar o schema Drizzle útil por domínios prioritários (`auth/profiles`, `mesas/bookings`, `billing`)
- usar o banco remoto `xqjiizwtfavpvxytqzvv` já provisionado como fonte de conferência
- iniciar os primeiros módulos da API `mesa`

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
