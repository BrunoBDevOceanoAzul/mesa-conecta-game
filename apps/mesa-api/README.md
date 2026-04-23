# mesa-api

API separada da plataforma `mesa`.

## Objetivo desta etapa

Esta primeira etapa cria a fundação da API e estabelece um baseline do banco remoto do Supabase usando Drizzle.

## Comandos principais

```bash
npm --prefix apps/mesa-api run dev
npm --prefix apps/mesa-api run typecheck
npm --prefix apps/mesa-api run db:introspect
```

## Regra de baseline

O projeto remoto correto do Supabase e `xqjiizwtfavpvxytqzvv`.

O banco remoto foi provisionado a partir das migrations existentes em `supabase/migrations` com:

```bash
supabase db push --db-url 'postgresql://postgres.xqjiizwtfavpvxytqzvv:***@aws-1-us-west-2.pooler.supabase.com:6543/postgres'
```

Depois disso, a validacao manual confirmou tabelas de aplicacao no schema `public`.

## Situacao atual do Drizzle

A infraestrutura do Drizzle esta pronta, mas a introspeccao automatica nao produziu um schema util nesta etapa, apesar de detectar tabelas e policies.

Por isso, o proximo passo e:

1. usar o banco remoto ja provisionado como fonte de conferência
2. curar manualmente o schema Drizzle por domínio
3. começar pelos domínios prioritários:
   - `auth/profiles`
   - `mesas/bookings`
   - `billing`

Mudanças futuras devem seguir por migrations revisadas.
