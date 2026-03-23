import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackStoreEvent } from "@/lib/store-tracking";
import { useAuth } from "@/contexts/AuthContext";
import { ShareButton } from "@/components/shared/ShareModal";
import { MesaCard } from "@/components/shared/MesaCard";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { ReputationBadge } from "@/components/reviews/ReputationBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin, Users, Store, Calendar, Sparkles, ArrowRight,
  Wifi, Wind, Coffee, Accessibility, DoorOpen, Star,
  Award, ChevronRight, Clock, Gamepad2, Building2, MessageSquareText, Instagram
} from "lucide-react";

const featureIcons: Record<string, any> = {
  "ar-condicionado": Wind,
  "wi-fi": Wifi,
  wifi: Wifi,
  cafeteria: Coffee,
  bar: Coffee,
  acessibilidade: Accessibility,
  "salas reservadas": DoorOpen,
  "espaço premium": Star,
};

interface StoreData {
  profile: any;
  storeProfile: any;
  tables: any[];
  badges: any[];
}

export default function LojaPublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadProfile();
  }, [slug]);

  useEffect(() => {
    if (data?.profile) {
      const storeName = data.storeProfile?.venue_name || data.profile.display_name || data.profile.name || "Loja";
      document.title = `${storeName} | Loja de RPG na HIVIUM`;
      setMeta("description", `Veja agenda, estrutura, mesas e perfil público de ${storeName} na HIVIUM.`);
      setMeta("og:title", `${storeName} | Loja de RPG na HIVIUM`);
      setMeta("og:description", `Conheça ${storeName}, sua estrutura, agenda de mesas e eventos de RPG na HIVIUM.`);
      setMeta("og:url", window.location.href);
      setMeta("og:type", "profile");
      if (data.profile.avatar_url) setMeta("og:image", data.profile.avatar_url);
    }
    return () => { document.title = "HIVIUM"; };
  }, [data]);

  function setMeta(name: string, content: string) {
    const attr = name.startsWith("og:") ? "property" : "name";
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.setAttribute("content", content);
  }

  async function loadProfile() {
    setLoading(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug)
      .eq("role", "store")
      .maybeSingle();

    if (!profile || profile.is_public === false) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const [storeRes, tablesRes, badgesRes, storeDataRes] = await Promise.all([
      supabase.from("store_profiles").select("*").eq("user_id", profile.user_id).maybeSingle(),
      supabase.from("game_tables").select("*").eq("store_user_id", profile.user_id).in("status", ["published", "full"]).order("start_at", { ascending: true }).limit(6),
      supabase.from("master_badges").select("*, badge_definitions(*)").eq("user_id", profile.user_id).limit(12),
      supabase.from("stores").select("id, slug").eq("owner_id", profile.user_id).maybeSingle(),
    ]);

    setData({
      profile,
      storeProfile: storeRes.data,
      tables: tablesRes.data || [],
      badges: badgesRes.data || [],
    });
    setLoading(false);

    // Track page view
    if (storeDataRes.data?.id) {
      trackStoreEvent(storeDataRes.data.id, "page_view", { slug, referrer: document.referrer || null });
    }
  }

  if (loading) return <LoadingSkeleton />;
  if (notFound || !data) return <NotFoundState />;

  const { profile, storeProfile, tables, badges } = data;
  const storeName = storeProfile?.venue_name || profile.display_name || profile.name || "Loja";
  const city = storeProfile?.city || profile.city;
  const state = storeProfile?.state || profile.state;
  const capacity = storeProfile?.capacity_total;
  const simTables = storeProfile?.simultaneous_tables;
  const avgTicket = storeProfile?.average_ticket;
  const features = (storeProfile?.structure_features_json as string[]) || [];
  const catalog = (storeProfile?.games_catalog_json as string[]) || [];
  const opDays = (storeProfile?.operation_days_json as string[]) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/6 via-transparent to-transparent" />
        {profile.cover_image_url && (
          <div className="absolute inset-0">
            <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover opacity-15" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          </div>
        )}
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative shrink-0">
              <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border-2 border-secondary/20 overflow-hidden bg-surface shadow-lg shadow-secondary/10">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={storeName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                    <Store className="h-12 w-12 text-secondary" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1 block">
                Loja / Luderia
              </span>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2 leading-tight">
                {storeName}
              </h1>
              {city && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" /> {city}{state ? `, ${state}` : ""}
                </p>
              )}

              <div className="flex flex-wrap gap-4 mb-6">
                {capacity && <StatChip icon={Users} label="Capacidade" value={capacity} />}
                {simTables && <StatChip icon={Gamepad2} label="Mesas simultâneas" value={simTables} />}
                {avgTicket && <StatChip icon={Star} label="Ticket médio" value={`R$${avgTicket}`} />}
                <StatChip icon={Calendar} label="Agenda" value={tables.length} />
              </div>

              <div className="flex flex-wrap gap-3">
                {tables.length > 0 ? (
                  <Button variant="gradient-premium" size="lg" onClick={() => document.getElementById("agenda")?.scrollIntoView({ behavior: "smooth" })}>
                    Ver agenda <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button variant="gradient-premium" size="lg" asChild>
                    <Link to="/explorar">Explorar mesas <ArrowRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
                <ShareButton entityType="loja" entityId={profile.user_id} entityTitle={`Perfil de ${storeName}`} entitySlug={slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-24 space-y-12">
        {/* SOBRE */}
        {profile.bio && (
          <section>
            <SectionTitle icon={Building2}>Sobre a Casa</SectionTitle>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">{profile.bio}</p>
          </section>
        )}

        {/* ESTRUTURA */}
        {features.length > 0 && (
          <section>
            <SectionTitle icon={Store}>Estrutura</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {features.map((f) => {
                const Icon = featureIcons[f.toLowerCase()] || Star;
                return (
                  <div key={f} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3 transition-all hover:border-secondary/30">
                    <Icon className="h-5 w-5 text-secondary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{f}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* OPERAÇÃO */}
        {opDays.length > 0 && (
          <section>
            <SectionTitle icon={Clock}>Dias de Operação</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {opDays.map((d) => (
                <span key={d} className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground">{d}</span>
              ))}
            </div>
          </section>
        )}

        {/* CATÁLOGO */}
        {catalog.length > 0 && (
          <section>
            <SectionTitle icon={Gamepad2}>Catálogo de Jogos</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {catalog.map((g) => (
                <span key={g} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">{g}</span>
              ))}
            </div>
          </section>
        )}

        {/* BADGES */}
        {badges.length > 0 && (
          <section>
            <SectionTitle icon={Award}>Conquistas</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {badges.map((b: any) => (
                <div key={b.id} className="rounded-xl border border-border bg-card p-4 text-center hover:scale-[1.02] transition-all">
                  <div className="text-2xl mb-2">🏆</div>
                  <p className="text-sm font-semibold text-foreground">{b.badge_definitions?.name || "Badge"}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AVALIAÇÕES */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <SectionTitle icon={Star}>Avaliações</SectionTitle>
            {storeProfile?.average_rating > 0 && (
              <ReputationBadge rating={storeProfile.average_rating} totalReviews={storeProfile.total_reviews || 0} />
            )}
          </div>
          <ReviewsList reviewedUserId={profile.user_id} reviewType="store" showHeader={false} />
        </section>

        {/* AGENDA / MESAS */}
        <section id="agenda">
          <SectionTitle icon={Calendar}>
            Agenda {tables.length > 0 ? `(${tables.length})` : ""}
          </SectionTitle>
          {tables.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((t: any) => {
              const gmName = "Mestre";
                return (
                  <MesaCard
                    key={t.id}
                    mesa={{
                      id: t.id,
                      title: t.title,
                      system: t.system_name,
                      session_type: t.session_type || "one-shot",
                      format: t.play_format || "presencial",
                      city: t.city,
                      venue: t.venue_name,
                      min_price: t.min_price || 0,
                      max_price: t.max_price || 0,
                      seats_total: t.seats_total || 5,
                      seats_available: t.seats_available || 0,
                      gm_name: gmName,
                      start_at: t.start_at || new Date().toISOString(),
                      status: t.status || "published",
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma mesa ou evento agendado no momento.</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/explorar">Explorar mesas</Link>
              </Button>
            </div>
          )}
        </section>

        {/* CTA FINAL */}
        <section className="rounded-2xl border border-secondary/20 p-8 sm:p-12 text-center" style={{ backgroundImage: "var(--gradient-premium)", backgroundSize: "200% 200%", backgroundPosition: "0% 50%", opacity: 0.95 }}>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-primary-foreground mb-3">
            Venha jogar na {storeName}
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-6">
            Explore a agenda, reserve sua vaga e viva experiências incríveis de RPG.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="hero" size="lg" className="bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25" asChild>
              <Link to="/explorar">Explorar mesas <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
            {!user && (
              <Button variant="hero-outline" size="lg" className="border-white/30 text-primary-foreground hover:bg-white/10" asChild>
                <Link to="/cadastro">Criar conta grátis</Link>
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-xl font-display font-semibold text-foreground mb-5">
      <Icon className="h-5 w-5 text-secondary" />
      {children}
    </h2>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 border border-border">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 pt-20">
        <div className="flex gap-6">
          <Skeleton className="h-36 w-36 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Loja não encontrada</h1>
        <p className="text-muted-foreground mb-6">Essa loja/luderia não existe ou não está com perfil público.</p>
        <Button variant="gradient" asChild>
          <Link to="/explorar">Explorar mesas</Link>
        </Button>
      </div>
    </div>
  );
}
