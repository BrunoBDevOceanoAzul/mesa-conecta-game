import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NearbyStoresMap } from "@/components/shared/NearbyStoresMap";
import { MesaCard } from "@/components/shared/MesaCard";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { calculateMatchScore } from "@/lib/match-scoring";
import { supabase } from "@/integrations/supabase/client";
import { Search, Calendar, MapPin, Gamepad2, BarChart3, Heart, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const navItems = [
  { label: "Início", path: "/dashboard/jogador", icon: <Gamepad2 className="h-4 w-4" /> },
  { label: "Explorar", path: "/explorar", icon: <Compass className="h-4 w-4" /> },
  { label: "Minhas Reservas", path: "/dashboard/jogador", icon: <Calendar className="h-4 w-4" /> },
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
  const [profile, setProfile] = useState<{ name?: string; city?: string; lat?: number; lng?: number } | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>([]);

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
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Olá, {displayName} 🎲</h1>
          <p className="text-muted-foreground mt-1">Mesas curadas pela HIVIUM para o seu perfil.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Mesas disponíveis", value: mesas.length.toString(), icon: <MapPin className="h-5 w-5 text-primary" /> },
            { label: "Recomendadas", value: topRecs.length.toString(), icon: <Sparkles className="h-5 w-5 text-secondary" /> },
            { label: "Match médio", value: topRecs.length > 0 ? `${Math.round(topRecs.reduce((a, b) => a + b.matchScore, 0) / topRecs.length)}%` : "—", icon: <BarChart3 className="h-5 w-5 text-accent" /> },
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
      </div>
    </DashboardLayout>
  );
}
