import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Gamepad2, Compass, Calendar, CreditCard, BarChart3, Loader2, Trash2 } from "lucide-react";
import { MesaCard } from "@/components/shared/MesaCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const navItems = [
  { label: "Início", path: "/dashboard/jogador", icon: <Gamepad2 className="h-4 w-4" /> },
  { label: "Explorar", path: "/explorar", icon: <Compass className="h-4 w-4" /> },
  { label: "Minhas Reservas", path: "/minhas-reservas", icon: <Calendar className="h-4 w-4" /> },
  { label: "Assinatura", path: "/billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Favoritos", path: "/favoritos", icon: <Heart className="h-4 w-4" /> },
  { label: "Feed", path: "/feed", icon: <BarChart3 className="h-4 w-4" /> },
];

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("favorites")
      .select("id, mesa_id, created_at, mesas:mesa_id(id, title, system, city, min_price, max_price, seats_total, seats_available, gm_name, start_at, image_url, format, session_type, tags, play_styles, status)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFavorites(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFavorites(); }, [user]);

  const removeFavorite = async (favId: string) => {
    await supabase.from("favorites").delete().eq("id", favId);
    setFavorites((prev) => prev.filter((f) => f.id !== favId));
    toast.success("Removido dos favoritos");
  };

  return (
    <DashboardLayout role="player" navItems={navItems} userName={user?.user_metadata?.name || "Jogador"}>
      <div className="space-y-6">
        <div>
          <h1 className="text-h2 text-foreground flex items-center gap-2"><Heart className="h-6 w-6 text-primary" /> Meus Favoritos</h1>
          <p className="text-sm text-muted-foreground mt-1">Mesas que você salvou para acompanhar</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">Nenhum favorito ainda</p>
            <p className="text-xs text-muted-foreground/60">Explore mesas e toque no ❤️ para salvar aqui</p>
            <Button onClick={() => navigate("/explorar")} className="gap-1.5">
              <Compass className="h-4 w-4" /> Explorar Mesas
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => {
              const m = fav.mesas;
              if (!m) return null;
              return (
                <div key={fav.id} className="relative group">
                  <MesaCard mesa={m} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm h-8 w-8"
                    onClick={() => removeFavorite(fav.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
