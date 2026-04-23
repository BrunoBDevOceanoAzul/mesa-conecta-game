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

## O Que Ainda Nao Foi Executado

Ainda nao foi feito:

- curadoria manual do schema Drizzle por domínio a partir do banco já provisionado
- criação de endpoints de domínio
- migração do frontend

## Próximos Passos Aprovados

Ordem recomendada para a próxima sessão de execução:

1. transformar o banco provisionado em schema Drizzle útil por domínio
2. iniciar `auth/profiles`
3. seguir para `mesas/bookings`
4. alinhar o frontend para consumir a API `mesa` por módulos

## Ponto Atual De Retomada

Parada atual:

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

Observação importante:

- a introspecção automática do `drizzle-kit` contra o banco já provisionado detecta as tabelas e policies, mas nesta versão/combinação de CLI ela não concluiu com geração útil de schema versionado; os arquivos `drizzle/schema.ts` e `drizzle/relations.ts` permaneceram praticamente vazios
- por isso, o próximo passo aprovado deixa de ser “introspectar mais uma vez” e passa a ser “curar o schema Drizzle por domínio a partir do banco já provisionado”

Na próxima retomada, nao reabrir o debate arquitetural do zero.

O próximo trabalho deve começar por:

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
