import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShareButton } from "@/components/shared/ShareModal";
import { MesaCard } from "@/components/shared/MesaCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { StartChatButton } from "@/components/chat/StartChatButton";
import { ReputationBadge } from "@/components/reviews/ReputationBadge";
import {
  MapPin, Star, Users, Swords, BookOpen, Calendar,
  Shield, Sparkles, Award, ArrowRight, Heart, GraduationCap,
  Briefcase, Brain, Clock, Gamepad2, ChevronRight, Instagram
} from "lucide-react";

interface GMData {
  profile: any;
  gmProfile: any;
  tables: any[];
  badges: any[];
}

export default function MestrePublicProfile() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<GMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    loadProfile();
  }, [slug]);

  useEffect(() => {
    if (data?.profile) {
      document.title = `${data.profile.display_name || data.profile.name} | Mestre de RPG na HIVIUM`;
      setMetaTag("description", `Conheça ${data.profile.display_name || data.profile.name}, seus sistemas, estilo de jogo, mesas disponíveis e perfil público na HIVIUM.`);
      setMetaTag("og:title", `${data.profile.display_name || data.profile.name} | Mestre de RPG na HIVIUM`);
      setMetaTag("og:description", `Mestre de RPG especializado em ${(data.profile.preferred_systems || []).slice(0, 3).join(", ") || "diversos sistemas"}. Veja mesas disponíveis na HIVIUM.`);
      setMetaTag("og:url", window.location.href);
      setMetaTag("og:type", "profile");
      if (data.profile.avatar_url) setMetaTag("og:image", data.profile.avatar_url);
    }
    return () => { document.title = "HIVIUM"; };
  }, [data]);

  function setMetaTag(name: string, content: string) {
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
      .eq("role", "gm")
      .maybeSingle();

    if (!profile || profile.is_public === false) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const [gmRes, tablesRes, badgesRes] = await Promise.all([
      supabase.from("gm_profiles").select("*").eq("user_id", profile.user_id).maybeSingle(),
      supabase.from("game_tables").select("*").eq("gm_user_id", profile.user_id).in("status", ["published", "full"]).order("start_at", { ascending: true }).limit(6),
      supabase.from("master_badges").select("*, badge_definitions(*)").eq("user_id", profile.user_id).limit(12),
    ]);

    setData({
      profile,
      gmProfile: gmRes.data,
      tables: tablesRes.data || [],
      badges: badgesRes.data || [],
    });
    setLoading(false);
  }

  if (loading) return <LoadingSkeleton />;
  if (notFound || !data) return <NotFoundState />;

  const { profile, gmProfile, tables, badges } = data;
  const name = profile.display_name || profile.name || "Mestre";
  const systems = (profile.preferred_systems || (gmProfile?.systems_mastered_json as string[]) || []) as string[];
  const styles = (profile.narrative_styles || (gmProfile?.narrative_style_json as string[]) || []) as string[];
  const formats = (gmProfile?.accepted_formats_json as string[]) || profile.mesa_formats || [];
  const rating = gmProfile?.average_rating || 0;
  const totalTables = gmProfile?.total_tables || tables.length;
  const totalBookings = gmProfile?.total_bookings || 0;

  const specialTags: { label: string; icon: any }[] = [];
  if (gmProfile?.beginner_friendly) specialTags.push({ label: "Beginner Friendly", icon: Heart });
  if (gmProfile?.supports_corporate) specialTags.push({ label: "Corporativo", icon: Briefcase });
  if (gmProfile?.supports_educational) specialTags.push({ label: "Educacional", icon: GraduationCap });
  if (gmProfile?.supports_therapeutic) specialTags.push({ label: "Terapêutico", icon: Brain });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-transparent to-transparent" />
        {profile.cover_image_url && (
          <div className="absolute inset-0">
            <img src={profile.cover_image_url} alt="" className="w-full h-full object-cover opacity-15" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
          </div>
        )}
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-2xl border-2 border-primary/20 overflow-hidden bg-surface shadow-lg shadow-primary/10">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-display font-bold text-primary bg-primary/10">
                    {name.charAt(0)}
                  </div>
                )}
              </div>
              {rating > 0 && (
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-secondary-foreground shadow-md">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {profile.current_title && (
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    {profile.current_title}
                  </span>
                )}
                {badges.some((b: any) => b.is_founder_badge) && (
                  <Badge variant="outline" className="border-secondary/40 text-secondary text-[10px]">
                    <Sparkles className="h-3 w-3 mr-1" /> Founder
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2 leading-tight">
                {name}
              </h1>
              {profile.city && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" /> {profile.city}{profile.state ? `, ${profile.state}` : ""}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-6">
                <StatChip icon={Swords} label="Mesas" value={totalTables} />
                <StatChip icon={Users} label="Reservas" value={totalBookings} />
                <StatChip icon={BookOpen} label="Sistemas" value={systems.length} />
                {gmProfile?.max_players_default && (
                  <StatChip icon={Users} label="Max jogadores" value={gmProfile.max_players_default} />
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                {tables.length > 0 ? (
                  <Button variant="gradient" size="lg" onClick={() => document.getElementById("mesas")?.scrollIntoView({ behavior: "smooth" })}>
                    Ver mesas <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button variant="gradient" size="lg" asChild>
                    <Link to="/explorar">Explorar mesas <ArrowRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
                <StartChatButton
                  targetUserId={profile.user_id}
                  targetName={name}
                  conversationType="gm_player"
                  subject={`Conversa com ${name}`}
                  variant="outline"
                  size="lg"
                  label="Falar com o mestre"
                  otherRoleLabel="gm"
                  myRoleLabel="player"
                />
                <ShareButton entityType="mestre" entityId={profile.user_id} entityTitle={`Perfil de ${name}`} entitySlug={slug} />
                {profile.instagram_handle && (
                  <Button variant="outline" size="lg" asChild>
                    <a href={`https://www.instagram.com/${profile.instagram_handle}/`} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4 mr-1.5" />
                      @{profile.instagram_handle}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-24 space-y-12">
        {/* SOBRE */}
        {profile.bio && (
          <section>
            <SectionTitle icon={BookOpen}>Sobre</SectionTitle>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">{profile.bio}</p>
          </section>
        )}

        {/* ESPECIALIDADES */}
        {(systems.length > 0 || styles.length > 0 || formats.length > 0 || specialTags.length > 0) && (
          <section>
            <SectionTitle icon={Shield}>Especialidades</SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {systems.length > 0 && <ChipBlock title="Sistemas" items={systems} />}
              {styles.length > 0 && <ChipBlock title="Estilos narrativos" items={styles} />}
              {formats.length > 0 && <ChipBlock title="Formatos" items={formats} />}
              {specialTags.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Especial</p>
                  <div className="flex flex-wrap gap-2">
                    {specialTags.map((t) => (
                      <span key={t.label} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                        <t.icon className="h-3.5 w-3.5" /> {t.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* BADGES */}
        {badges.length > 0 && (
          <section>
            <SectionTitle icon={Award}>Conquistas</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {badges.map((b: any) => (
                <div key={b.id} className={`rounded-xl border p-4 text-center transition-all hover:scale-[1.02] ${b.is_founder_badge ? "border-secondary/30 bg-secondary/5" : "border-border bg-card"}`}>
                  <div className="text-2xl mb-2">🏆</div>
                  <p className="text-sm font-semibold text-foreground">{b.badge_definitions?.name || "Badge"}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{b.badge_definitions?.description || ""}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AVALIAÇÕES */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <SectionTitle icon={Star}>Avaliações</SectionTitle>
            {rating > 0 && (
              <ReputationBadge rating={rating} totalReviews={gmProfile?.total_reviews || 0} />
            )}
          </div>
          <ReviewsList reviewedUserId={profile.user_id} reviewType="gm" showHeader={false} />
        </section>

        {/* MESAS */}
        <section id="mesas">
          <SectionTitle icon={Gamepad2}>
            Mesas {tables.length > 0 ? `(${tables.length})` : ""}
          </SectionTitle>
          {tables.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((t: any) => (
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
                    gm_name: name,
                    gm_instagram: profile.instagram_handle,
                    start_at: t.start_at || new Date().toISOString(),
                    status: t.status || "published",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma mesa publicada no momento.</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link to="/explorar">Explorar outras mesas</Link>
              </Button>
            </div>
          )}
        </section>

        {/* PRICING RANGE */}
        {gmProfile && (gmProfile.price_min > 0 || gmProfile.price_max > 0) && (
          <section>
            <SectionTitle icon={Sparkles}>Faixa de Preço</SectionTitle>
            <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Ticket por sessão</p>
                <p className="text-2xl font-display font-bold text-foreground mt-1">
                  R${gmProfile.price_min}
                  {gmProfile.price_max > gmProfile.price_min && (
                    <span className="text-lg text-muted-foreground font-normal"> – R${gmProfile.price_max}</span>
                  )}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* CTA FINAL */}
        <section className="rounded-2xl border border-primary/20 p-8 sm:p-12 text-center" style={{ backgroundImage: "var(--gradient-primary)", backgroundSize: "200% 200%", backgroundPosition: "0% 50%", opacity: 0.95 }}>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-primary-foreground mb-3">
            Pronto para jogar?
          </h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-6">
            Explore as mesas de {name} ou descubra outros mestres incríveis na HIVIUM.
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
      <Icon className="h-5 w-5 text-primary" />
      {children}
    </h2>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 border border-border">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ChipBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
            {item}
          </span>
        ))}
      </div>
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
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
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
        <div className="text-6xl mb-4">🎭</div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Perfil não encontrado</h1>
        <p className="text-muted-foreground mb-6">Esse perfil de mestre não existe ou não está público.</p>
        <Button variant="gradient" asChild>
          <Link to="/explorar">Explorar mesas</Link>
        </Button>
      </div>
    </div>
  );
}
