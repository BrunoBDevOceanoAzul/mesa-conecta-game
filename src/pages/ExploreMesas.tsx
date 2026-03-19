import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { calculateMatchScore } from "@/lib/match-scoring";
import { MesaCard } from "@/components/shared/MesaCard";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import { Search, SlidersHorizontal, X, Loader2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RPG_SYSTEMS, POPULAR_SYSTEMS } from "@/data/rpg-systems";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Mesa = {
  id: string;
  title: string;
  description: string | null;
  system: string;
  session_type: string;
  format: string;
  city: string | null;
  venue: string | null;
  min_price: number;
  max_price: number;
  seats_total: number;
  seats_available: number;
  gm_id: string;
  gm_name: string;
  start_at: string;
  status: string;
  tags: string[] | null;
  play_styles: string[] | null;
  image_url: string | null;
};

const FORMATS = ["presencial", "online", "híbrido"];
const SESSION_TYPES = ["one-shot", "campanha", "evento"];
const PRICE_RANGES = [
  { label: "Até R$20", min: 0, max: 20 },
  { label: "R$20–40", min: 20, max: 40 },
  { label: "R$40–60", min: 40, max: 60 },
  { label: "R$60+", min: 60, max: 9999 },
];

export default function ExploreMesas() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const { preferences } = useUserPreferences();
  const { user } = useAuth();
  const [boostedMesaIds, setBoostedMesaIds] = useState<Set<string>>(new Set());
  const [founderMesaIds, setFounderMesaIds] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSystem, setFilterSystem] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterSessionType, setFilterSessionType] = useState("");
  const [filterPriceRange, setFilterPriceRange] = useState("");
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchMesas() {
      setLoading(true);
      const [mesasRes, boostRes] = await Promise.all([
        supabase
          .from("mesas")
          .select("*")
          .eq("status", "aberta")
          .gte("start_at", new Date().toISOString())
          .order("start_at", { ascending: true }),
        supabase
          .from("boost_campaigns")
          .select("target_id, is_founder_benefit")
          .eq("target_type", "mesa")
          .eq("status", "active"),
      ]);
      setMesas((mesasRes.data as Mesa[]) || []);
      const boosted = new Set<string>();
      const founder = new Set<string>();
      (boostRes.data || []).forEach((c: any) => {
        boosted.add(c.target_id);
        if (c.is_founder_benefit) founder.add(c.target_id);
      });
      setBoostedMesaIds(boosted);
      setFounderMesaIds(founder);
      setLoading(false);
    }
    fetchMesas();
  }, []);

  const hasActiveFilters = filterSystem || filterCity || filterFormat || filterSessionType || filterPriceRange || filterDate;

  const clearFilters = () => {
    setFilterSystem("");
    setFilterCity("");
    setFilterFormat("");
    setFilterSessionType("");
    setFilterPriceRange("");
    setFilterDate(undefined);
    setSearchQuery("");
  };

  const filteredAndScored = useMemo(() => {
    let result = mesas;

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.system.toLowerCase().includes(q) ||
          m.gm_name.toLowerCase().includes(q) ||
          (m.city && m.city.toLowerCase().includes(q))
      );
    }

    // Filters
    if (filterSystem) result = result.filter((m) => m.system === filterSystem);
    if (filterCity) {
      const fc = filterCity.toLowerCase().split(",")[0].trim();
      result = result.filter((m) => m.city && m.city.toLowerCase().includes(fc));
    }
    if (filterFormat) result = result.filter((m) => m.format === filterFormat);
    if (filterSessionType) result = result.filter((m) => m.session_type === filterSessionType);
    if (filterPriceRange) {
      const range = PRICE_RANGES.find((r) => r.label === filterPriceRange);
      if (range) {
        result = result.filter((m) => m.min_price >= range.min && m.min_price <= range.max);
      }
    }
    if (filterDate) {
      const dateStr = format(filterDate, "yyyy-MM-dd");
      result = result.filter((m) => m.start_at.startsWith(dateStr));
    }

    // Calculate match scores
    const scored = result.map((mesa) => ({
      mesa,
      matchScore: preferences
        ? calculateMatchScore(preferences, {
            city: mesa.city,
            system: mesa.system,
            format: mesa.format,
            min_price: mesa.min_price,
            max_price: mesa.max_price,
            play_styles: mesa.play_styles || [],
            session_type: mesa.session_type,
          })
        : 0,
    }));

    // Sort by match score (desc), then date (asc)
    scored.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return new Date(a.mesa.start_at).getTime() - new Date(b.mesa.start_at).getTime();
    });

    return scored;
  }, [mesas, searchQuery, filterSystem, filterCity, filterFormat, filterSessionType, filterPriceRange, filterDate, preferences]);

  // Unique systems from available mesas
  const availableSystems = useMemo(() => {
    const systems = new Set(mesas.map((m) => m.system));
    return Array.from(systems).sort();
  }, [mesas]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-3">
            <Compass className="h-8 w-8 text-primary" />
            Explorar Mesas
          </h1>
          <p className="text-muted-foreground mt-2">Encontre a mesa perfeita para você. {preferences ? "Ordenado por aderência ao seu perfil HIVIUM." : "Faça login para ver sua curadoria personalizada."}</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, sistema, mestre ou cidade..."
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                !
              </span>
            )}
          </Button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Filtros avançados</span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <X className="h-3 w-3" /> Limpar todos
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="field-label mb-1.5 block">Sistema</label>
                <select
                  value={filterSystem}
                  onChange={(e) => setFilterSystem(e.target.value)}
                  className="field-input"
                >
                  <option value="">Todos os sistemas</option>
                  {availableSystems.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="field-label mb-1.5 block">Cidade</label>
                <CityAutocomplete
                  value={filterCity}
                  onChange={(city) => setFilterCity(city)}
                  placeholder="Filtrar por cidade..."
                />
              </div>

              {/* Format */}
              <div>
                <label className="field-label mb-1.5 block">Formato</label>
                <div className="flex gap-1.5">
                  {FORMATS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterFormat(filterFormat === f ? "" : f)}
                      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                        filterFormat === f
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session type */}
              <div>
                <label className="field-label mb-1.5 block">Tipo</label>
                <div className="flex gap-1.5">
                  {SESSION_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterSessionType(filterSessionType === t ? "" : t)}
                      className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all capitalize ${
                        filterSessionType === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {t === "one-shot" ? "One-Shot" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label mb-1.5 block">Faixa de preço</label>
                <select
                  value={filterPriceRange}
                  onChange={(e) => setFilterPriceRange(e.target.value)}
                  className="field-input"
                >
                  <option value="">Qualquer preço</option>
                  {PRICE_RANGES.map((r) => (
                    <option key={r.label} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="field-label mb-1.5 block">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-lg",
                        !filterDate && "text-muted-foreground"
                      )}
                    >
                      {filterDate ? format(filterDate, "dd MMM yyyy", { locale: ptBR }) : "Qualquer data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={setFilterDate}
                      disabled={(date) => date < new Date()}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAndScored.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center">
            <Compass className="mx-auto h-14 w-14 text-muted-foreground mb-4" />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              {mesas.length === 0 ? "Nenhuma mesa disponível ainda" : "Nenhuma mesa encontrada"}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {mesas.length === 0
                ? "Mestres ainda estão criando mesas. Volte em breve!"
                : "Tente ajustar os filtros para encontrar mais resultados."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredAndScored.length} mesa{filteredAndScored.length !== 1 ? "s" : ""} encontrada{filteredAndScored.length !== 1 ? "s" : ""}
            </p>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredAndScored.map(({ mesa, matchScore }) => (
                <MesaCard
                  key={mesa.id}
                  mesa={mesa}
                  matchScore={matchScore}
                  sponsored={boostedMesaIds.has(mesa.id)}
                  founderBenefit={founderMesaIds.has(mesa.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
