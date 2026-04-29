# Design: Hive como Interface Única da Sócio do Tabuleiro

> Data: 2026-04-26
> Status: Aprovado para implementação

## Objetivo

Transformar o Hive no **único ponto de entrada** da interface da Sócio do Tabuleiro. Todas as funcionalidades do MVP1 (e futuras) devem ser acessíveis através do ecossistema Hive. Páginas isoladas são eliminadas; funcionalidades são absorvidas pelas frequências ou por overlays/contextuais.

## Estado Atual vs. Futuro

### Estado Atual
- 40+ páginas isoladas em `src/pages/`
- Navegação por URLs diretas (`/feed`, `/explorar`, `/fichas`)
- Hive criado como página adicional (`/hive`), não como padrão
- Layout antigo ainda renderizado para usuários logados

### Estado Futuro (Target)
- **Única URL para usuários logados:** `/` (redireciona para Hive)
- Hive é o **layout raiz** da aplicação para usuários autenticados
- Todas as funcionalidades são acessíveis via frequências ou overlays dentro do Hive
- URLs legadas redirecionam para Hive com frequência correspondente
- Fluxos isolados (login, onboarding, checkout, páginas legais) permanecem como rotas diretas, mas são acessados **a partir do Hive**

## Arquitetura Hexagonal Aplicada

### Ports & Adapters (Frontend)

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE                            │
│  React Router │ Supabase Client │ API Client │ LocalStorage │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ drives
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION (Ports)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐  │
│  │ HiveContext │ │ AuthContext │ │ NotificationService   │  │
│  │ (State)     │ │ (Identity)  │ │ (Events)              │  │
│  └─────────────┘ └─────────────┘ └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ uses
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN (Use Cases)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ Navigate │ │ Fetch    │ │ Submit   │ │ ToggleGhost  │   │
│  │ Frequency│ │ Content  │ │ Form     │ │ Mode         │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ triggers
┌─────────────────────────────────────────────────────────────┐
│                    UI (Adapters)                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │LinkerHive│ │Frequency │ │Overlays  │ │Dock/Nav      │   │
│  │(Layout)  │ │Content   │ │(Modals)  │ │(Mobile)      │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Princípios SOLID

- **S (Single Responsibility):** Cada frequência tem uma única responsabilidade de domínio
- **O (Open/Closed):** Novas frequências são adicionadas sem modificar o Hive core
- **L (Liskov Substitution):** Todas as frequências implementam a mesma interface (FrequencyContent)
- **I (Interface Segregation):** Frequências recebem apenas os props/dados que precisam
- **D (Dependency Inversion):** Frequências dependem de abstrações (hooks), não de implementações diretas

## Mapeamento de Páginas → Frequências

### Frequência: Comandante (home)
**Responsabilidade:** Perfil pessoal, dashboard, agenda, notificações, ações rápidas

| Página Original | Destino no Hive |
|----------------|----------------|
| `/dashboard/jogador` | Comandante → Stats de jogador |
| `/dashboard/mestre` | Comandante → Stats de mestre |
| `/dashboard/loja` | Comandante → Stats de loja |
| `/perfil` | Comandante → Edição de perfil (overlay) |
| `/editar-perfil` | Comandante → Edição de perfil (overlay) |
| `/conta` | Comandante → Configurações de conta (overlay) |
| `/agenda` | Comandante → Agenda pessoal (tab/overlay) |
| `/notificacoes` | Comandante → Centro de notificações (overlay) |
| `/minhas-reservas` | Comandante → Minhas reservas (tab/overlay) |
| `/favoritos` | Comandante → Favoritos (tab/overlay) |

### Frequência: Mercado (market)
**Responsabilidade:** Descoberta de mesas, reservas, pagamentos, planos

| Página Original | Destino no Hive |
|----------------|----------------|
| `/explorar` | Mercado → Lista de mesas (já integrado) |
| `/buscar` | Mercado → Busca avançada |
| `/mesa/:id` | Mercado → Detalhe da mesa (overlay/drawer) |
| `/checkout` | Mercado → Checkout (overlay/modal) |
| `/checkout/:planId` | Mercado → Checkout de plano (overlay/modal) |
| `/billing` | Mercado → Faturamento e planos (tab/overlay) |
| `/precos` | Mercado → Tabela de preços (tab) |
| `/boost` | Mercado → Dashboard de boost (tab, GM/Store only) |

### Frequência: Academia (academy)
**Responsabilidade:** Conteúdo social, feed, posts, comunidade

| Página Original | Destino no Hive |
|----------------|----------------|
| `/feed` | Academia → Feed social (já integrado) |
| `/post/:slug` | Academia → Detalhe do post (overlay) |
| `/mestre/:slug` | Academia → Perfil público do mestre (overlay) |
| `/loja/:slug` | Academia → Perfil público da loja (overlay) |

### Frequência: Playground (playground)
**Responsabilidade:** Fichas, ferramentas de sessão, assets

| Página Original | Destino no Hive |
|----------------|----------------|
| `/fichas` | Playground → Lista de fichas (já integrado) |
| `/fichas/:id` | Playground → Editor de ficha (overlay) |
| `/mesa/:id/ficha` | Playground → Ficha da mesa (overlay) |

### Frequência: Network (network)
**Responsabilidade:** Mensagens, conexões, networking

| Página Original | Destino no Hive |
|----------------|----------------|
| `/mensagens` | Network → Lista de conversas (já integrado) |
| `/indicar` | Network → Programa de indicação (tab) |

### Frequência: Clã (hives)
**Responsabilidade:** Grupos, comunidades fechadas, CRM do mestre

| Página Original | Destino no Hive |
|----------------|----------------|
| (nova) | Clã → Gestão de membros (overlay) |

### Frequência: Radar (radar)
**Responsabilidade:** Descoberta geográfica, mapa, eventos próximos

| Página Original | Destino no Hive |
|----------------|----------------|
| (nova) | Radar → Mapa de mesas próximas (já integrado) |

### Páginas Fora do Hive (Fluxos Isolados)

Estas páginas mantêm rotas diretas porque são **fluxos de entrada ou saída** do sistema, não parte da navegação contínua:

| Página | Razão |
|--------|-------|
| `/login` | Fluxo de autenticação |
| `/cadastro` | Fluxo de onboarding inicial |
| `/reset-password` | Fluxo de recuperação |
| `/onboarding` | Wizard de primeiro acesso |
| `/onboarding/:role` | Wizard de primeiro acesso com role |
| `/admin/*` | Backoffice (pode ter layout próprio) |
| `/hive_admin/:userId` | Admin de usuários (layout próprio) |
| `/privacidade` | Página legal estática |
| `/termos` | Página legal estática |
| `/ajuda` | Help center |
| `/faq` | FAQ |
| `/quem-somos` | Sobre |
| `/contato` | Contato |
| `/para-lojas` | Landing page |
| `/para-marcas` | Landing page |
| `/interesse` | Captura de leads |
| `/unsubscribe` | Cancelamento de email |
| `/erro` | Página de erro |
| `*` | 404 |

## Estrutura de Rotas (React Router)

```tsx
<Routes>
  {/* Hive é a raiz para usuários logados */}
  <Route path="/" element={<ProtectedRoute><Hive /></ProtectedRoute>} />
  <Route path="/hive" element={<ProtectedRoute><Hive /></ProtectedRoute>} />
  
  {/* Redirecionamentos de URLs legadas para Hive com frequência */}
  <Route path="/feed" element={<Navigate to="/hive?f=academy" replace />} />
  <Route path="/explorar" element={<Navigate to="/hive?f=market" replace />} />
  <Route path="/buscar" element={<Navigate to="/hive?f=market" replace />} />
  <Route path="/fichas" element={<Navigate to="/hive?f=playground" replace />} />
  <Route path="/mensagens" element={<Navigate to="/hive?f=network" replace />} />
  <Route path="/dashboard/jogador" element={<Navigate to="/hive?f=home" replace />} />
  <Route path="/dashboard/mestre" element={<Navigate to="/hive?f=home" replace />} />
  <Route path="/dashboard/loja" element={<Navigate to="/hive?f=home" replace />} />
  <Route path="/perfil" element={<Navigate to="/hive?f=home&overlay=profile" replace />} />
  <Route path="/editar-perfil" element={<Navigate to="/hive?f=home&overlay=profile" replace />} />
  <Route path="/agenda" element={<Navigate to="/hive?f=home&overlay=agenda" replace />} />
  <Route path="/notificacoes" element={<Navigate to="/hive?f=home&overlay=notifications" replace />} />
  <Route path="/minhas-reservas" element={<Navigate to="/hive?f=home&overlay=bookings" replace />} />
  <Route path="/favoritos" element={<Navigate to="/hive?f=home&overlay=favorites" replace />} />
  <Route path="/conta" element={<Navigate to="/hive?f=home&overlay=settings" replace />} />
  <Route path="/billing" element={<Navigate to="/hive?f=market&overlay=billing" replace />} />
  <Route path="/checkout" element={<Navigate to="/hive?f=market&overlay=checkout" replace />} />
  <Route path="/checkout/:planId" element={<Navigate to="/hive?f=market&overlay=checkout&planId=:planId" replace />} />
  <Route path="/precos" element={<Navigate to="/hive?f=market&overlay=pricing" replace />} />
  <Route path="/boost" element={<Navigate to="/hive?f=market&overlay=boost" replace />} />
  <Route path="/post/:slug" element={<Navigate to="/hive?f=academy&overlay=post&slug=:slug" replace />} />
  <Route path="/mestre/:slug" element={<Navigate to="/hive?f=academy&overlay=mestre&slug=:slug" replace />} />
  <Route path="/loja/:slug" element={<Navigate to="/hive?f=academy&overlay=loja&slug=:slug" replace />} />
  <Route path="/fichas/:id" element={<Navigate to="/hive?f=playground&overlay=sheet&id=:id" replace />} />
  <Route path="/mesa/:id/ficha" element={<Navigate to="/hive?f=playground&overlay=sheet&id=:id" replace />} />
  <Route path="/indicar" element={<Navigate to="/hive?f=network&overlay=referral" replace />} />
  
  {/* Fluxos isolados (não parte do Hive) */}
  <Route path="/login" element={<Login />} />
  <Route path="/cadastro" element={<Signup />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
  <Route path="/onboarding/:role" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
  
  {/* Admin */}
  <Route path="/admin/*" element={<ProtectedRoute allowedRoles={["admin"]}><AdminRoutes /></ProtectedRoute>} />
  <Route path="/hive_admin/:userId" element={<ProtectedRoute allowedRoles={["admin"]}><HiveAdmin /></ProtectedRoute>} />
  
  {/* Páginas públicas */}
  <Route path="/privacidade" element={<PrivacyPolicy />} />
  <Route path="/termos" element={<TermsOfService />} />
  <Route path="/ajuda" element={<HelpCenter />} />
  <Route path="/faq" element={<FAQPage />} />
  <Route path="/quem-somos" element={<QuemSomos />} />
  <Route path="/contato" element={<Contato />} />
  <Route path="/para-lojas" element={<ParaLojas />} />
  <Route path="/para-marcas" element={<ParaMarcas />} />
  <Route path="/interesse" element={<Interesse />} />
  <Route path="/unsubscribe" element={<Unsubscribe />} />
  <Route path="/erro" element={<ErrorPage />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

## Query Params do Hive

O Hive deve ler query params para determinar estado inicial:

- `?f=market` → Frequência ativa = Market
- `?f=home&overlay=profile` → Frequência Home + overlay de perfil aberto
- `?f=academy&overlay=post&slug=abc` → Frequência Academy + overlay de post

## Overlays vs. Páginas

### O que vira Overlay (Drawer/Modal)

Overlays são conteúdos que aparecem **sobre** a frequência ativa, não a substituem:

- Editar perfil (`?overlay=profile`)
- Detalhe de mesa (`?overlay=mesa&id=xxx`)
- Detalhe de post (`?overlay=post&slug=xxx`)
- Checkout (`?overlay=checkout`)
- Notificações (`?overlay=notifications`)
- Configurações (`?overlay=settings`)
- Agenda (`?overlay=agenda`)

### O que vira Tab dentro da Frequência

Tabs são conteúdos que **substituem** parte da frequência, mas mantêm o contexto:

- Minhas reservas (tab no Comandante)
- Favoritos (tab no Comandante)
- Faturamento (tab no Mercado)
- Preços (tab no Mercado)
- Indicações (tab no Network)

### O que vira Frequência própria

Conteúdos que são **modos de navegação principais**:

- Feed social → Academy
- Explorar mesas → Market
- Fichas → Playground
- Mensagens → Network
- Mapa → Radar
- Clãs → Hives

## Componentes Core (Arquitetura)

### 1. HiveLayout (Adapter)

```tsx
interface HiveLayoutProps {
  children: React.ReactNode;
  activeFrequency: HiveFrequency;
  overlays: OverlayConfig[];
}
```

Responsabilidade: Renderizar o background, o LinkerHive (dock/hexágonos), e gerenciar overlays.

### 2. FrequencyRouter (Domain)

```tsx
interface FrequencyConfig {
  id: HiveFrequency;
  label: string;
  icon: React.ComponentType;
  component: React.LazyExoticComponent<React.FC>;
  tabs?: TabConfig[];
}
```

Responsabilidade: Mapear frequências para componentes e gerenciar tabs.

### 3. OverlayManager (Application)

```tsx
interface OverlayConfig {
  id: string;
  component: React.LazyExoticComponent<React.FC>;
  params: Record<string, string>;
  onClose: () => void;
}
```

Responsabilidade: Gerenciar pilha de overlays (z-index, histórico, animações).

### 4. HiveContext (State)

```tsx
interface HiveState {
  activeFrequency: HiveFrequency;
  overlays: OverlayConfig[];
  isExpanded: boolean;
  isGhostMode: boolean;
  privacySettings: PrivacySettings;
}
```

Responsabilidade: Estado global do Hive. Lê query params na inicialização.

## Testes (TDD)

### Testes Unitários

1. **HiveContext:** 
   - Deve inicializar com frequência padrão 'home'
   - Deve ler `?f=market` da URL
   - Deve adicionar/remover overlays

2. **OverlayManager:**
   - Deve empilhar overlays (z-index incremental)
   - Deve fechar overlay ao pressionar ESC
   - Deve sincronizar com query params

3. **FrequencyRouter:**
   - Deve renderizar componente correto para cada frequência
   - Deve passar props corretas para tabs

### Testes de Integração

1. **Navegação completa:**
   - Acessar `/feed` → redireciona para `/hive?f=academy`
   - Hive renderiza AcademyContent
   - Overlay de post abre ao clicar em post

2. **Overlay stack:**
   - Abrir overlay de mesa dentro do Market
   - Abrir overlay de checkout dentro do overlay de mesa
   - Fechar checkout → volta para mesa
   - Fechar mesa → volta para Market

## Mobile-First

- Dock inferior flutuante (já implementado)
- Overlays em tela cheia no mobile (drawer bottom sheet)
- Tabs em scroll horizontal no mobile
- Gestos de swipe para navegar entre frequências

## Decisões

1. **Não usar Next.js App Router:** O projeto usa Next.js + React Router temporariamente.  Hive funciona perfeitamente com React Router.

2. **Query params ao invés de nested routes:** `/hive?f=market` ao invés de `/hive/market`. Motivo: simplifica o router e evita conflitos com rotas legadas.

3. **Overlays como query params:** `?overlay=profile` ao invés de path separado. Motivo: mantém o estado na URL sem complicar o route matching.

4. **Lazy loading por frequência:** Cada frequência é carregada sob demanda. Reduz bundle inicial.

5. **Fluxos isolados fora do Hive:** Login, onboarding, páginas legais não fazem sentido dentro do Hive. São fluxos de entrada/saída.

## Próximos Passos

1. Refatorar `App.tsx` para novo sistema de rotas
2. Criar `HiveLayout` component
3. Criar `OverlayManager` 
4. Criar `FrequencyRouter`
5. Migrar cada página para overlay/tab/frequência
6. Implementar query params sync
7. Testar navegação completa
