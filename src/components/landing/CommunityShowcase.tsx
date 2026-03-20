import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MesaCard } from "@/components/shared/MesaCard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CreateCommunityMesaDialog } from "@/components/mesa/CreateCommunityMesaDialog";
import { Gamepad2, ArrowRight, Users, MapPin, Calendar } from "lucide-react";

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
  end_at: string | null;
  status: string;
  tags: string[] | null;
  image_url: string | null;
  cover_image_url: string | null;
  mesa_type: string;
  organizer_name: string | null;
};

export function CommunityShowcase() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [stats, setStats] = useState({ total: 0, cities: 0, players: 0 });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchCommunityMesas() {
      const { data } = await supabase
        .from("mesas")
        .select("*")
        .eq("status", "aberta")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(6);

      const allMesas = (data || []) as Mesa[];
      setMesas(allMesas);

      // Simple stats
      const cities = new Set(allMesas.filter((m) => m.city).map((m) => m.city));
      const totalPlayers = allMesas.reduce((acc, m) => acc + (m.seats_total - m.seats_available), 0);
      setStats({ total: allMesas.length, cities: cities.size, players: totalPlayers });
    }
    fetchCommunityMesas();
  }, []);

  const handleCreated = () => {
    // Refresh
    supabase
      .from("mesas")
      .select("*")
      .eq("status", "aberta")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(6)
      .then(({ data }) => setMesas((data || []) as Mesa[]));
  };

  return (
    <section id="vitrine" className="py-24 md:py-32 border-t border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <span className="section-label">Vitrine de Mesas</span>
          <h2 className="text-3xl font-display font-bold md:text-4xl leading-tight mb-4">
            Jogue com a comunidade.{" "}
            <span className="gradient-text">Sem complicação.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Escolha um jogo, publique uma mesa e encontre jogadores perto de você.
            Gratuito para qualquer pessoa, sempre.
          </p>
        </motion.div>

        {/* Stats */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center gap-8 mb-10"
          >
            {[
              { icon: Gamepad2, label: "Mesas ativas", value: stats.total },
              { icon: MapPin, label: "Cidades", value: stats.cities },
              { icon: Users, label: "Jogadores", value: stats.players },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                <s.icon className="h-4 w-4 text-primary" />
                <span className="font-display font-bold text-foreground">{s.value}</span>
                <span className="text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Mesas grid */}
        {mesas.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mesas.slice(0, 3).map((mesa, i) => (
                <motion.div
                  key={mesa.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <MesaCard mesa={mesa} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center"
          >
            <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-display font-bold text-foreground mb-2">
              Seja o primeiro a criar uma mesa!
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Publique uma mesa de jogo e a comunidade te encontra.
            </p>
            {user ? (
              <CreateCommunityMesaDialog onCreated={handleCreated}>
                <Button variant="hero" size="lg" className="gap-2">
                  <Gamepad2 className="h-4 w-4" /> Criar primeira mesa
                </Button>
              </CreateCommunityMesaDialog>
            ) : (
              <Button variant="hero" size="lg" className="gap-2" onClick={() => navigate("/cadastro")}>
                <Gamepad2 className="h-4 w-4" /> Criar conta e publicar mesa
              </Button>
            )}
          </motion.div>
        )}

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-4 mt-10"
        >
          <Button
            variant="outline"
            size="lg"
            className="gap-2 rounded-xl"
            onClick={() => navigate("/explorar")}
          >
            Ver todas as mesas <ArrowRight className="h-4 w-4" />
          </Button>
          {user && (
            <CreateCommunityMesaDialog onCreated={handleCreated}>
              <Button variant="hero" size="lg" className="gap-2 rounded-xl">
                <Gamepad2 className="h-4 w-4" /> Organizar mesa
              </Button>
            </CreateCommunityMesaDialog>
          )}
        </motion.div>
      </div>
    </section>
  );
}