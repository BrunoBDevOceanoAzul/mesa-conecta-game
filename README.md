# Sócio do Tabuleiro

> Plataforma de conexão e curadoria para o universo tabletop.

## Estrutura do Projeto

```
├── frontend/          # Aplicação Next.js + React + TypeScript
│   ├── src/           # Código fonte
│   ├── public/        # Assets públicos
│   └── package.json   # Dependências frontend
│
├── backend/           # API Node.js (Fastify + Drizzle)
│   ├── src/           # Código fonte
│   ├── drizzle/       # Migrations
│   └── package.json   # Dependências backend
│
├── infra/             # Infraestrutura e deploy
│   ├── k8s/           # Kubernetes manifests
│   ├── docker/        # Dockerfiles e compose
│   ├── scripts/       # Scripts de deploy
│   ├── github/        # GitHub Actions workflows
│   └── do/            # DigitalOcean App Platform specs
│
├── docs/              # Documentação
│   ├── architecture/  # Docs de arquitetura
│   ├── gitops/        # Docs de GitOps
│   └── superpowers/   # Plans e specs
│
├── assets/            # Assets gerais do app
│   ├── images/        # Imagens, screenshots, icons
│   ├── fonts/         # Fontes customizadas
│   └── logos/         # Logos e identidade visual
│
├── supabase/          # Configuração Supabase
└── package.json       # Root workspace config
```

## Tecnologias

### Frontend
- Next.js 14 + React 18 + TypeScript
- TailwindCSS + shadcn/ui
- React Router v6
- Framer Motion
- TanStack Query
- Supabase Auth

### Backend
- Node.js + Fastify
- TypeScript
- Drizzle ORM
- PostgreSQL (Supabase)
- Zod (validation)

## Scripts

```bash
# Desenvolvimento
npm run dev        # Frontend
npm run dev:api    # Backend

# Build
npm run build      # Frontend
npm run build:api  # Backend

# Testes
npm run test       # Frontend
npm run test:api   # Backend

# Verificação completa
npm run verify
```

## Ambientes

- **Dev:** `https://dev.sociodotabuleiro.app.br`
- **Homolog:** `https://homolog.sociodotabuleiro.app.br`
- **Prod:** `https://sociodotabuleiro.app.br`

## Arquitetura

O projeto segue os princípios de **Clean Architecture** e **SOLID**:

- **Frontend:** Componentes desacoplados, hooks customizados, contextos especializados
- **Backend:** Monólito modular com separação por domínios (Clean Architecture)
- **Banco:** Drizzle ORM como fonte de verdade do schema
- **Deploy:** GitOps com Kubernetes (DOKS) e DigitalOcean App Platform

## Módulos

| Módulo | Descrição |
|--------|-----------|
| Auth | Autenticação JWT via Supabase |
| Profiles | Perfis de usuário (player, GM, store, brand) |
| Mesas | Gestão de mesas e sessões |
| Bookings | Reservas e fila de espera |
| Billing | Faturamento, planos e integração Asaas |
| Social | Feed, posts, comentários e likes |
| Chat | Mensagens e conversas |
| Reviews | Avaliações e reputação |
| Hive | Interface principal hexagonal |
| Admin | Backoffice e CMS |

## Licença

Proprietário - Sócio do Tabuleiro
