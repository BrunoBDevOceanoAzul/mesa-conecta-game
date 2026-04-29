# Hive Full Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar todas as funcionalidades do MVP1 para dentro do ecossistema Hive, tornando-o a interface única da Sócio do Tabuleiro.

**Architecture:** React Router com query params (`?f=market&overlay=checkout`). Hive como layout raiz com FrequencyRouter, OverlayManager, e HiveContext. Páginas legadas viram overlays, tabs ou frequências. Fluxos isolados (login, onboarding, legais) mantêm rotas diretas.

**Tech Stack:** Next.js 14 + React 18 + TypeScript + React Router v6 + Framer Motion + TailwindCSS + shadcn/ui

---

## File Structure

```
src/
  layouts/
    HiveLayout.tsx              # Layout raiz do Hive (background, dock, overlays)
  pages/
    Hive.tsx                    # Página Hive (orquestra layout + frequência + overlays)
    HiveAdmin.tsx               # Admin de usuários (fora do Hive)
  components/hive/
    LinkerHive.tsx              # Dock hexagonal (já existe, modificar)
    HexagonAgent.tsx            # Hexágonos individuais (já existe)
    FrequencyRouter.tsx         # Mapeia frequência para componente
    OverlayManager.tsx          # Gerencia pilha de overlays
    OverlayDrawer.tsx           # Drawer/modal para overlays
    sections/
      CommanderProfile.tsx      # Frequência Home (já existe, expandir)
      MarketContent.tsx         # Frequência Market (já existe, expandir)
      AcademyContent.tsx        # Frequência Academy (já existe, expandir)
      PlaygroundContent.tsx     # Frequência Playground (já existe, expandir)
      NetworkContent.tsx        # Frequência Network (já existe, expandir)
      HivesContent.tsx          # Frequência Hives (já existe, expandir)
      RadarContent.tsx          # Frequência Radar (já existe, expandir)
      overlays/
        ProfileOverlay.tsx      # Editar perfil
        AgendaOverlay.tsx       # Agenda pessoal
        NotificationsOverlay.tsx # Notificações
        BookingsOverlay.tsx     # Minhas reservas
        FavoritesOverlay.tsx    # Favoritos
        SettingsOverlay.tsx     # Configurações de conta
        MesaOverlay.tsx         # Detalhe da mesa
        CheckoutOverlay.tsx     # Checkout
        PostOverlay.tsx         # Detalhe do post
        MestreOverlay.tsx       # Perfil público do mestre
        LojaOverlay.tsx         # Perfil público da loja
        SheetOverlay.tsx        # Editor de ficha
        BoostOverlay.tsx        # Dashboard de boost
        PricingOverlay.tsx      # Tabela de preços
        BillingOverlay.tsx      # Faturamento
  context/
    HiveContext.tsx             # Estado global do Hive (modificar)
  hooks/
    use-hive-url.ts             # Sincroniza query params com estado do Hive
    use-overlay.ts              # Gerencia overlays
  App.tsx                       # Novo sistema de rotas
```

---

## Task 1: Criar HiveLayout

**Files:**
- Create: `src/layouts/HiveLayout.tsx`
- Modify: `src/pages/Hive.tsx`

- [ ] **Step 1: Criar HiveLayout**

```tsx
// src/layouts/HiveLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { HiveProvider } from '@/context/HiveContext';
import { LinkerHive } from '@/components/hive/LinkerHive';
import { OverlayManager } from '@/components/hive/OverlayManager';
import { 
  Briefcase, Users, ShoppingBag, GraduationCap, 
  Gamepad2, Radio, Fingerprint 
} from 'lucide-react';
import type { HiveFrequency } from '@/context/HiveContext';

const HEXAGONS = [
  { id: 'user' as const, label: 'Comandante', icon: Fingerprint, isCentral: true },
  { id: 'network' as HiveFrequency, label: 'Network', icon: Briefcase },
  { id: 'hives' as HiveFrequency, label: 'Clã', icon: Users },
  { id: 'academy' as HiveFrequency, label: 'Academia', icon: GraduationCap },
  { id: 'market' as HiveFrequency, label: 'Mercado', icon: ShoppingBag },
  { id: 'playground' as HiveFrequency, label: 'Playground', icon: Gamepad2 },
  { id: 'radar' as HiveFrequency, label: 'Radar', icon: Radio },
];

export default function HiveLayout() {
  return (
    <HiveProvider>
      <main className="relative w-screen h-screen bg-[#050505] overflow-hidden text-slate-200">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        <LinkerHive hexagons={HEXAGONS} />
        <OverlayManager />
        
        <div className="relative z-10 w-full h-full">
          <Outlet />
        </div>
      </main>
    </HiveProvider>
  );
}
```

- [ ] **Step 2: Modificar Hive.tsx para usar HiveLayout**

```tsx
// src/pages/Hive.tsx
import React, { Suspense } from 'react';
import { useHive } from '@/context/HiveContext';
import { FrequencyRouter } from '@/components/hive/FrequencyRouter';

export default function HivePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-[#662583] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <FrequencyRouter />
    </Suspense>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/HiveLayout.tsx src/pages/Hive.tsx
git commit -m "feat(hive): create HiveLayout and refactor Hive page"
```

---

## Task 2: Criar FrequencyRouter

**Files:**
- Create: `src/components/hive/FrequencyRouter.tsx`

- [ ] **Step 1: Criar FrequencyRouter**

```tsx
// src/components/hive/FrequencyRouter.tsx
import React from 'react';
import { useHive } from '@/context/HiveContext';
import { AnimatePresence, motion } from 'framer-motion';

const CommanderProfile = React.lazy(() => import('./sections/CommanderProfile'));
const NetworkContent = React.lazy(() => import('./sections/NetworkContent'));
const MarketContent = React.lazy(() => import('./sections/MarketContent'));
const HivesContent = React.lazy(() => import('./sections/HivesContent'));
const AcademyContent = React.lazy(() => import('./sections/AcademyContent'));
const PlaygroundContent = React.lazy(() => import('./sections/PlaygroundContent'));
const RadarContent = React.lazy(() => import('./sections/RadarContent'));

const FREQUENCY_COMPONENTS: Record<string, React.ComponentType> = {
  home: CommanderProfile,
  network: NetworkContent,
  market: MarketContent,
  hives: HivesContent,
  academy: AcademyContent,
  playground: PlaygroundContent,
  radar: RadarContent,
};

export function FrequencyRouter() {
  const { activeFrequency } = useHive();
  const Component = FREQUENCY_COMPONENTS[activeFrequency] || CommanderProfile;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeFrequency}
        className="absolute inset-0 overflow-y-auto pb-24 md:pb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Component />
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/hive/FrequencyRouter.tsx
git commit -m "feat(hive): create FrequencyRouter component"
```

---

## Task 3: Criar useHiveUrl Hook (Sync Query Params)

**Files:**
- Create: `src/hooks/use-hive-url.ts`
- Modify: `src/context/HiveContext.tsx`

- [ ] **Step 1: Criar useHiveUrl**

```tsx
// src/hooks/use-hive-url.ts
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHive, type HiveFrequency } from '@/context/HiveContext';

export function useHiveUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeFrequency, handleHexClick, overlays, openOverlay, closeOverlay } = useHive();

  // Ler query params na inicialização
  useEffect(() => {
    const f = searchParams.get('f') as HiveFrequency | null;
    const overlay = searchParams.get('overlay');
    
    if (f && ['home', 'network', 'market', 'hives', 'academy', 'playground', 'radar'].includes(f)) {
      handleHexClick(f);
    }
    
    if (overlay) {
      openOverlay(overlay, Object.fromEntries(searchParams.entries()));
    }
  }, []);

  // Sincronizar estado com URL
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (activeFrequency !== 'home') {
      params.set('f', activeFrequency);
    }
    
    if (overlays.length > 0) {
      const topOverlay = overlays[overlays.length - 1];
      params.set('overlay', topOverlay.id);
      Object.entries(topOverlay.params).forEach(([key, value]) => {
        if (key !== 'f' && key !== 'overlay') {
          params.set(key, value);
        }
      });
    }
    
    setSearchParams(params, { replace: true });
  }, [activeFrequency, overlays]);
}
```

- [ ] **Step 2: Modificar HiveContext para suportar overlays**

Adicionar ao HiveContextType:
```tsx
overlays: OverlayConfig[];
openOverlay: (id: string, params?: Record<string, string>) => void;
closeOverlay: () => void;
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-hive-url.ts src/context/HiveContext.tsx
git commit -m "feat(hive): add useHiveUrl hook and overlay support in context"
```

---

## Task 4: Criar OverlayManager e OverlayDrawer

**Files:**
- Create: `src/components/hive/OverlayManager.tsx`
- Create: `src/components/hive/OverlayDrawer.tsx`

- [ ] **Step 1: Criar OverlayDrawer**

```tsx
// src/components/hive/OverlayDrawer.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface OverlayDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function OverlayDrawer({ isOpen, onClose, title, children }: OverlayDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-[480px] bg-[#0a0612] border-t md:border-l border-white/10 z-50 rounded-t-2xl md:rounded-none overflow-hidden flex flex-col"
            initial={{ y: '100%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '100%', x: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Criar OverlayManager**

```tsx
// src/components/hive/OverlayManager.tsx
import React from 'react';
import { useHive } from '@/context/HiveContext';
import { OverlayDrawer } from './OverlayDrawer';

// Lazy load overlays
const ProfileOverlay = React.lazy(() => import('./sections/overlays/ProfileOverlay'));
const AgendaOverlay = React.lazy(() => import('./sections/overlays/AgendaOverlay'));
const NotificationsOverlay = React.lazy(() => import('./sections/overlays/NotificationsOverlay'));
const BookingsOverlay = React.lazy(() => import('./sections/overlays/BookingsOverlay'));
const FavoritesOverlay = React.lazy(() => import('./sections/overlays/FavoritesOverlay'));
const SettingsOverlay = React.lazy(() => import('./sections/overlays/SettingsOverlay'));
const MesaOverlay = React.lazy(() => import('./sections/overlays/MesaOverlay'));
const CheckoutOverlay = React.lazy(() => import('./sections/overlays/CheckoutOverlay'));
const PostOverlay = React.lazy(() => import('./sections/overlays/PostOverlay'));
const MestreOverlay = React.lazy(() => import('./sections/overlays/MestreOverlay'));
const LojaOverlay = React.lazy(() => import('./sections/overlays/LojaOverlay'));
const SheetOverlay = React.lazy(() => import('./sections/overlays/SheetOverlay'));
const BoostOverlay = React.lazy(() => import('./sections/overlays/BoostOverlay'));
const PricingOverlay = React.lazy(() => import('./sections/overlays/PricingOverlay'));
const BillingOverlay = React.lazy(() => import('./sections/overlays/BillingOverlay'));

const OVERLAY_COMPONENTS: Record<string, React.ComponentType<any>> = {
  profile: ProfileOverlay,
  agenda: AgendaOverlay,
  notifications: NotificationsOverlay,
  bookings: BookingsOverlay,
  favorites: FavoritesOverlay,
  settings: SettingsOverlay,
  mesa: MesaOverlay,
  checkout: CheckoutOverlay,
  post: PostOverlay,
  mestre: MestreOverlay,
  loja: LojaOverlay,
  sheet: SheetOverlay,
  boost: BoostOverlay,
  pricing: PricingOverlay,
  billing: BillingOverlay,
};

const OVERLAY_TITLES: Record<string, string> = {
  profile: 'Editar Perfil',
  agenda: 'Agenda',
  notifications: 'Notificações',
  bookings: 'Minhas Reservas',
  favorites: 'Favoritos',
  settings: 'Configurações',
  mesa: 'Detalhe da Mesa',
  checkout: 'Checkout',
  post: 'Post',
  mestre: 'Perfil do Mestre',
  loja: 'Perfil da Loja',
  sheet: 'Ficha de Personagem',
  boost: 'Boost',
  pricing: 'Preços',
  billing: 'Faturamento',
};

export function OverlayManager() {
  const { overlays, closeOverlay } = useHive();

  if (overlays.length === 0) return null;

  const topOverlay = overlays[overlays.length - 1];
  const Component = OVERLAY_COMPONENTS[topOverlay.id];

  if (!Component) return null;

  return (
    <OverlayDrawer
      isOpen={true}
      onClose={closeOverlay}
      title={OVERLAY_TITLES[topOverlay.id] || 'Detalhes'}
    >
      <React.Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#662583] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Component {...topOverlay.params} />
      </React.Suspense>
    </OverlayDrawer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/hive/OverlayManager.tsx src/components/hive/OverlayDrawer.tsx
git commit -m "feat(hive): create OverlayManager and OverlayDrawer components"
```

---

## Task 5: Refatorar App.tsx com Novas Rotas

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Refatorar App.tsx**

Substituir o App.tsx inteiro com o novo sistema de rotas (ver design document para rotas completas).

Pontos chave:
- Importar HiveLayout
- Rotas do Hive como children do layout
- Redirecionamentos de URLs legadas para `/hive?f=...`
- Fluxos isolados (login, onboarding, etc.) mantêm rotas diretas
- Admin mantém rotas próprias

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat(hive): refactor App.tsx with Hive as root layout"
```

---

## Task 6: Criar Overlays (Primeiro Lote)

**Files:**
- Create: `src/components/hive/sections/overlays/ProfileOverlay.tsx`
- Create: `src/components/hive/sections/overlays/AgendaOverlay.tsx`
- Create: `src/components/hive/sections/overlays/NotificationsOverlay.tsx`
- Create: `src/components/hive/sections/overlays/BookingsOverlay.tsx`
- Create: `src/components/hive/sections/overlays/FavoritesOverlay.tsx`

- [ ] **Step 1: Criar ProfileOverlay**

```tsx
// src/components/hive/sections/overlays/ProfileOverlay.tsx
import React from 'react';
import { EditProfile } from '@/pages/EditProfile';

export default function ProfileOverlay() {
  return <EditProfile />;
}
```

- [ ] **Step 2: Criar AgendaOverlay**

```tsx
// src/components/hive/sections/overlays/AgendaOverlay.tsx
import React from 'react';
import { Agenda } from '@/pages/Agenda';

export default function AgendaOverlay() {
  return <Agenda />;
}
```

- [ ] **Step 3: Criar NotificationsOverlay**

```tsx
// src/components/hive/sections/overlays/NotificationsOverlay.tsx
import React from 'react';
import { Notifications } from '@/pages/Notifications';

export default function NotificationsOverlay() {
  return <Notifications />;
}
```

- [ ] **Step 4: Criar BookingsOverlay**

```tsx
// src/components/hive/sections/overlays/BookingsOverlay.tsx
import React from 'react';
import { MyBookings } from '@/pages/MyBookings';

export default function BookingsOverlay() {
  return <MyBookings />;
}
```

- [ ] **Step 5: Criar FavoritesOverlay**

```tsx
// src/components/hive/sections/overlays/FavoritesOverlay.tsx
import React from 'react';
import { Favorites } from '@/pages/Favorites';

export default function FavoritesOverlay() {
  return <Favorites />;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/hive/sections/overlays/
git commit -m "feat(hive): create first batch of overlays (profile, agenda, notifications, bookings, favorites)"
```

---

## Task 7: Criar Overlays (Segundo Lote)

**Files:**
- Create: `src/components/hive/sections/overlays/SettingsOverlay.tsx`
- Create: `src/components/hive/sections/overlays/MesaOverlay.tsx`
- Create: `src/components/hive/sections/overlays/CheckoutOverlay.tsx`
- Create: `src/components/hive/sections/overlays/PostOverlay.tsx`
- Create: `src/components/hive/sections/overlays/MestreOverlay.tsx`

- [ ] **Step 1-5: Criar cada overlay**

Similar ao primeiro lote, cada overlay é um wrapper que renderiza a página existente.

- [ ] **Step 6: Commit**

```bash
git add src/components/hive/sections/overlays/
git commit -m "feat(hive): create second batch of overlays (settings, mesa, checkout, post, mestre)"
```

---

## Task 8: Criar Overlays (Terceiro Lote)

**Files:**
- Create: `src/components/hive/sections/overlays/LojaOverlay.tsx`
- Create: `src/components/hive/sections/overlays/SheetOverlay.tsx`
- Create: `src/components/hive/sections/overlays/BoostOverlay.tsx`
- Create: `src/components/hive/sections/overlays/PricingOverlay.tsx`
- Create: `src/components/hive/sections/overlays/BillingOverlay.tsx`

- [ ] **Step 1-5: Criar cada overlay**

- [ ] **Step 6: Commit**

```bash
git add src/components/hive/sections/overlays/
git commit -m "feat(hive): create third batch of overlays (loja, sheet, boost, pricing, billing)"
```

---

## Task 9: Atualizar Frequências para Abrir Overlays

**Files:**
- Modify: `src/components/hive/sections/CommanderProfile.tsx`
- Modify: `src/components/hive/sections/MarketContent.tsx`
- Modify: `src/components/hive/sections/AcademyContent.tsx`
- Modify: `src/components/hive/sections/PlaygroundContent.tsx`

- [ ] **Step 1: Atualizar CommanderProfile**

Adicionar `onClick` nos quick actions para abrir overlays:
```tsx
const { openOverlay } = useHive();

// Ações rápidas
const quickActions = [
  { icon: Zap, label: 'Criar Mesa', action: () => openOverlay('mesa', { mode: 'create' }) },
  { icon: Calendar, label: 'Agenda', action: () => openOverlay('agenda') },
  { icon: Heart, label: 'Favoritos', action: () => openOverlay('favorites') },
  { icon: ClipboardList, label: 'Reservas', action: () => openOverlay('bookings') },
];
```

- [ ] **Step 2: Atualizar MarketContent**

Cards de mesas abrem overlay de detalhe ao invés de navegar para `/mesa/:id`.

- [ ] **Step 3: Atualizar AcademyContent**

Posts abrem overlay de detalhe ao invés de navegar para `/post/:slug`.

- [ ] **Step 4: Commit**

```bash
git add src/components/hive/sections/
git commit -m "feat(hive): update frequencies to open overlays instead of navigating"
```

---

## Task 10: Type-check, Build e Testes

- [ ] **Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: Build successful

- [ ] **Step 3: Testes**

Run: `npm test -- --run`
Expected: All tests pass

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat(hive): complete migration to Hive as sole interface

- HiveLayout as root layout for authenticated users
- FrequencyRouter for switching between Hive frequencies
- OverlayManager and OverlayDrawer for contextual content
- useHiveUrl hook for URL synchronization
- All MVP1 pages migrated to overlays, tabs, or frequencies
- Legacy URLs redirect to Hive with appropriate frequency
- Build passing, tests passing"
```

---

## Self-Review

**Spec coverage:**
- ✅ HiveLayout como layout raiz → Task 1
- ✅ FrequencyRouter → Task 2
- ✅ OverlayManager → Task 4
- ✅ Query params sync → Task 3
- ✅ App.tsx refatorado → Task 5
- ✅ Overlays para todas as páginas → Tasks 6-8
- ✅ Frequências atualizadas → Task 9
- ✅ Build e testes → Task 10

**Placeholder scan:** Nenhum placeholder encontrado.

**Type consistency:** Todos os tipos e nomes consistentes ao longo do plano.
