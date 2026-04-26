import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Gamepad2, Upload, RefreshCw, Search, CheckCircle2, XCircle,
  Package, Puzzle, Loader2, AlertTriangle
} from "lucide-react";

interface CatalogStats {
  total: number;
  games: number;
  expansions: number;
  accessories: number;
  rpg: number;
  available: number;
}

interface ImportRun {
  id: string;
  source_name: string;
  file_name: string | null;
  total_records: number;
  imported_records: number;
  failed_records: number;
  started_at: string;
  finished_at: string | null;
  status: string;
  logs_json: any;
}

export default function AdminCatalog() {
  const { toast } = useToast();
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [totalRes, gamesRes, expRes, accRes, rpgRes, availRes, runsRes] = await Promise.all([
      supabase.from("board_games_catalog").select("id", { count: "exact", head: true }),
      supabase.from("board_games_catalog").select("id", { count: "exact", head: true }).eq("type", "game"),
      supabase.from("board_games_catalog").select("id", { count: "exact", head: true }).eq("type", "expansion"),
      supabase.from("board_games_catalog").select("id", { count: "exact", head: true }).eq("type", "accessory"),
      supabase.from("board_games_catalog").select("id", { count: "exact", head: true }).eq("type", "rpg"),
      supabase.from("board_games_catalog").select("id", { count: "exact", head: true }).eq("is_available", true),
      supabase.from("catalog_import_runs").select("*").order("started_at", { ascending: false }).limit(10),
    ]);

    setStats({
      total: totalRes.count || 0,
      games: gamesRes.count || 0,
      expansions: expRes.count || 0,
      accessories: accRes.count || 0,
      rpg: rpgRes.count || 0,
      available: availRes.count || 0,
    });
    setRuns((runsRes.data || []) as ImportRun[]);
    setLoading(false);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) { setImporting(false); return; }

        const text = await file.text();
        let games: any[];
        try {
          games = JSON.parse(text);
        } catch {
          toast({ title: "Erro", description: "JSON inválido", variant: "destructive" });
          setImporting(false);
          return;
        }

        if (!Array.isArray(games)) {
          toast({ title: "Erro", description: "O JSON deve ser um array de jogos", variant: "destructive" });
          setImporting(false);
          return;
        }

        toast({ title: "Importando...", description: `Processando ${games.length} jogos...` });

        // Split into chunks to avoid payload limits
        const CHUNK = 500;
        let totalImported = 0;
        let totalFailed = 0;

        for (let i = 0; i < games.length; i += CHUNK) {
          const chunk = games.slice(i, i + CHUNK);
          const { data, error } = await supabase.functions.invoke("import-board-games", {
            body: { games: chunk, file_name: file.name },
          });

          if (error) {
            totalFailed += chunk.length;
          } else {
            totalImported += data?.imported || 0;
            totalFailed += data?.failed || 0;
          }
        }

        toast({
          title: "Importação concluída!",
          description: `${totalImported} importados, ${totalFailed} falhas.`,
        });
        fetchData();
        setImporting(false);
      };
      input.click();
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
      setImporting(false);
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase.rpc("search_board_games", {
      search_query: searchQuery.trim(),
      result_limit: 20,
    });
    setSearchResults(data || []);
    setSearching(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" /> Catálogo de Jogos
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Base de jogos de tabuleiro importada e indexada.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Atualizar
            </Button>
            <Button variant="hero" size="sm" onClick={handleImport} disabled={importing} className="gap-2">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? "Importando..." : "Importar JSON"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatBox icon={<Package className="h-5 w-5" />} label="Total" value={stats?.total || 0} />
          <StatBox icon={<Gamepad2 className="h-5 w-5" />} label="Jogos Base" value={stats?.games || 0} color="text-primary" />
          <StatBox icon={<Puzzle className="h-5 w-5" />} label="Expansões" value={stats?.expansions || 0} color="text-amber-500" />
          <StatBox icon={<Package className="h-5 w-5" />} label="Acessórios" value={stats?.accessories || 0} />
          <StatBox icon={<Package className="h-5 w-5" />} label="RPG" value={stats?.rpg || 0} color="text-purple-500" />
          <StatBox icon={<CheckCircle2 className="h-5 w-5" />} label="Disponíveis" value={stats?.available || 0} color="text-green-500" />
        </div>

        {/* Search test */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> Testar Busca
          </h3>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome do jogo..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching} size="sm">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map((g: any) => (
                <div key={g.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                  {g.thumbnail_url ? (
                    <img src={g.thumbnail_url} alt="" className="h-8 w-8 rounded object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">{g.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {g.type} · {g.min_players}-{g.max_players} jogadores · Score: {(g.similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Badge variant={g.type === "game" ? "secondary" : "outline"} className="text-[10px]">
                    {g.type === "game" ? "Jogo" : g.type === "expansion" ? "Expansão" : g.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import history */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" /> Histórico de Importações
          </h3>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma importação realizada ainda.</p>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <div key={run.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{run.file_name || "Importação"}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(run.started_at).toLocaleString("pt-BR")} · {run.source_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {run.imported_records}/{run.total_records}
                    </span>
                    {run.failed_records > 0 && (
                      <span className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {run.failed_records} falhas
                      </span>
                    )}
                    <Badge variant={run.status === "completed" ? "secondary" : run.status === "running" ? "default" : "destructive"} className="text-[10px]">
                      {run.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function StatBox({ icon, label, value, color = "text-foreground" }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className={`flex justify-center mb-2 ${color}`}>{icon}</div>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString("pt-BR")}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
