import React from 'react';
import { useHive } from '@/context/HiveContext';
import { OverlayDrawer } from './OverlayDrawer';

// Lazy load all overlay components
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
