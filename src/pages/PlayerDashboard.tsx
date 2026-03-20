import { useEffect, useState, useMemo } from "react";
import { ProfileCompletionBanner } from "@/components/shared/ProfileCompletionBanner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NearbyStoresMap } from "@/components/shared/NearbyStoresMap";
import { MesaCard } from "@/components/shared/MesaCard";
import { PendingReviewsBanner } from "@/components/reviews/PendingReviewsBanner";
import { PlayerPreparationBlock } from "@/components/mesa/PlayerPreparationBlock";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useSubscription } from "@/hooks/use-subscription";
import { calculateMatchScore } from "@/lib/match-scoring";
import { supabase } from "@/integrations/supabase/client";
import { Search, Calendar, MapPin, Gamepad2, BarChart3, Heart, Compass, Sparkles, CreditCard, Crown, Lock, Instagram, BookOpen, Plus } from "lucide-react";
import { CreateCommunityMesaDialog } from "@/components/mesa/CreateCommunityMesaDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getInstagramUrl, getInstagramHandle } from "@/lib/instagram";

const navItems = [
  { label: "Início", path: "/dashboard/jogador", icon: <Gamepad2 className="h-4 w-4" /> },
  { label: "Explorar", path: "/explorar", icon: <Compass className="h-4 w-4" /> },
  { label: "Minhas Reservas", path: "/dashboard/jogador", icon: <Calendar className="h-4 w-4" /> },
  { label: "Assinatura", path: "/billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Favoritos", path: "/dashboard/jogador", icon: <Heart className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <BarChart3 className="h-4 w-4" /> },
];

type Mesa = {
  id: string;
  title: string;
  system: string;
  session_type: string;
  format: string;
  city: string | null;
  venue: string | null;
  min_price: number;
  max_price: number;
  seats_total: number;
  seats_available: number;
  gm_name: string;
  start_at: string;
  status: string;
  tags: string[] | null;
  play_styles: string[] | null;
  image_url: string | null;
};

export default function PlayerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { preferences } = useUserPreferences();
  const sub = useSubscription();
  const isPremium = sub.isActive;
  const reservationLimit = isPremium ? ((sub.featureFlags.reservation_limit as number) || 2) : 0;
  const planLabel = sub.plan?.name || null;
  const [profile, setProfile] = useState<{ name?: string; city?: string; lat?: number; lng?: number } | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, city, lat, lng")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data);
      });

    // Fetch open mesas
    supabase
      .from("mesas")
      .select("*")
      .eq("status", "aberta")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(20)
      .then(({ data }) => {
        setMesas((data as Mesa[]) || []);
      });

    // Fetch my bookings with table info
    supabase
      .from("bookings")
      .select("id, game_table_id, status, game_tables(title, system_name)")
      .eq("player_user_id", user.id)
      .in("status", ["confirmed", "pending"])
      .then(({ data }) => {
        setMyBookings(data || []);
      });
  }, [user]);

  const displayName = profile?.name || user?.user_metadata?.name || "Aventureiro";

  // Calculate recommendations
  const recommendations = useMemo(() => {
    if (!preferences || mesas.length === 0) return [];

    return mesas
      .map((mesa) => ({
        mesa,
        matchScore: calculateMatchScore(preferences, {
          city: mesa.city,
          system: mesa.system,
          format: mesa.format,
          min_price: mesa.min_price,
          max_price: mesa.max_price,
          play_styles: mesa.play_styles || [],
          session_type: mesa.session_type,
        }),
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  }, [mesas, preferences]);

  const topRecs = recommendations.filter((r) => r.matchScore >= 55);

  return (
    <DashboardLayout role="player" navItems={navItems} userName={displayName}>
      <div className="space-y-8">
        <ProfileCompletionBanner />
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Olá, {displayName} 🎲</h1>
          <p className="text-muted-foreground mt-1">Mesas curadas pela HIVIUM para o seu perfil.</p>
        </div>

        {/* Plan badge */}
        {isPremium && planLabel && (
          <div className="self-start flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5">
            <Crown className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-display font-bold text-primary">{planLabel}</span>
            <span className="text-[10px] text-muted-foreground">até {reservationLimit} reservas/mês</span>
          </div>
        )}

        {/* Upgrade banner for free users */}
        {!sub.loading && !isPremium && (
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground flex-1">
              Desbloqueie mais reservas, favoritos expandidos e vantagens premium.
            </p>
            <Button variant="outline" size="sm" className="shrink-0 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate("/billing")}>
              Ver planos
            </Button>
          </div>
        )}

        {/* My Bookings - Preparation */}
        {myBookings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h2 className="text-base font-display font-semibold text-foreground">
                Preparação das suas mesas
              </h2>
            </div>
            {myBookings.map((booking: any) => {
              const table = booking.game_tables;
              if (!table) return null;
              return (
                <PlayerPreparationBlock
                  key={booking.id}
                  gameTableId={booking.game_table_id}
                  tableTitle={table.title}
                  systemName={table.system_name}
                />
              );
            })}
          </div>
        )}

        {/* Pending reviews */}
        <PendingReviewsBanner />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Mesas disponíveis", value: mesas.length.toString(), icon: <MapPin className="h-5 w-5 text-primary" /> },
            { label: "Curadas para você", value: topRecs.length.toString(), icon: <Sparkles className="h-5 w-5 text-secondary" /> },
            { label: "Reservas do mês", value: isPremium ? `0/${reservationLimit}` : <span className="flex items-center gap-1"><Lock className="h-4 w-4" /> Premium</span>, icon: <Calendar className="h-5 w-5 text-accent" /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/50">{s.icon}</div>
              <div>
                <div className="text-2xl font-display font-bold text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Curadas para você
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/explorar")} className="text-primary">
              Ver todas →
            </Button>
          </div>

          {topRecs.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {topRecs.slice(0, 3).map(({ mesa, matchScore }) => (
                <MesaCard key={mesa.id} mesa={mesa} matchScore={matchScore} />
              ))}
            </div>
          ) : mesas.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mesas.slice(0, 3).map((mesa) => (
                <MesaCard key={mesa.id} mesa={mesa} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
              <Gamepad2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma mesa disponível ainda. Em breve!</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/explorar")}>
                Explorar Mesas
              </Button>
            </div>
          )}
        </div>

        {/* Nearby Stores */}
        <NearbyStoresMap userLat={profile?.lat} userLng={profile?.lng} />

        {/* Instagram follow */}
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Instagram className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Siga a HIVIUM no Instagram</p>
            <p className="text-xs text-muted-foreground">Novidades, mesas em destaque e comunidade.</p>
          </div>
          <a
            href={getInstagramUrl("player_dashboard")}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <Instagram className="h-3.5 w-3.5" /> {getInstagramHandle()}
            </Button>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
