import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NearbyStoresMap } from "@/components/shared/NearbyStoresMap";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Search, Calendar, MapPin, Gamepad2, BarChart3, Heart } from "lucide-react";

const navItems = [
  { label: "Início", path: "/dashboard/jogador", icon: <Gamepad2 className="h-4 w-4" /> },
  { label: "Buscar Mesas", path: "/buscar", icon: <Search className="h-4 w-4" /> },
  { label: "Minhas Reservas", path: "/dashboard/jogador", icon: <Calendar className="h-4 w-4" /> },
  { label: "Favoritos", path: "/dashboard/jogador", icon: <Heart className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <BarChart3 className="h-4 w-4" /> },
];

export default function PlayerDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name?: string; city?: string; lat?: number; lng?: number } | null>(null);

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
  }, [user]);

  const displayName = profile?.name || user?.user_metadata?.name || "Aventureiro";

  return (
    <DashboardLayout role="player" navItems={navItems} userName={displayName}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Olá, {displayName}! 🎲</h1>
          <p className="text-muted-foreground mt-1">Aqui estão suas recomendações de hoje.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Mesas recomendadas", value: "0", icon: <MapPin className="h-5 w-5 text-primary" /> },
            { label: "Próximas sessões", value: "0", icon: <Calendar className="h-5 w-5 text-secondary" /> },
            { label: "Match médio", value: "—", icon: <BarChart3 className="h-5 w-5 text-accent" /> },
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

        {/* Empty state for tables */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">🎯 Melhores matches para você</h2>
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Gamepad2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma mesa disponível ainda. Em breve!</p>
          </div>
        </div>

        {/* Empty state for sessions */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">📅 Próximas sessões</h2>
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Você ainda não tem sessões agendadas.</p>
          </div>
        </div>

        {/* Nearby Stores */}
        <NearbyStoresMap userLat={profile?.lat} userLng={profile?.lng} />
      </div>
    </DashboardLayout>
  );
}
