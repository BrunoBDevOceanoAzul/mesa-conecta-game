import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Eye, EyeOff, Search, Filter, MessageSquareText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ReviewRow {
  id: string;
  booking_id: string;
  reviewer_user_id: string;
  reviewed_user_id: string | null;
  reviewed_table_id: string | null;
  rating: number;
  comment: string | null;
  review_type: string;
  status: string;
  is_verified: boolean;
  created_at: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setReviews((data as any[]) || []);
    setLoading(false);
  }

  async function toggleStatus(id: string, newStatus: string) {
    await supabase.from("reviews").update({ status: newStatus } as any).eq("id", id);
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    toast({ title: newStatus === "published" ? "Review publicada" : "Review ocultada" });
  }

  const filtered = reviews.filter((r) => {
    if (filterType !== "all" && r.review_type !== filterType) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (search && !r.comment?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const avgRating = filtered.length > 0
    ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
    : "—";

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: filtered.filter((r) => r.rating === star).length,
    pct: filtered.length > 0
      ? Math.round((filtered.filter((r) => r.rating === star).length / filtered.length) * 100)
      : 0,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 text-secondary" /> Moderação de Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e modere avaliações do ecossistema.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatBlock label="Total" value={String(filtered.length)} />
          <StatBlock label="Média" value={avgRating} />
          <StatBlock label="Publicadas" value={String(filtered.filter((r) => r.status === "published").length)} />
          <StatBlock label="Ocultas" value={String(filtered.filter((r) => r.status === "hidden").length)} />
        </div>

        {/* Rating distribution */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição de Notas</h3>
          <div className="space-y-2">
            {ratingDist.map((d) => (
              <div key={d.star} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-8">{d.star}★</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-secondary transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">{d.count} ({d.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por comentário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="gm">Mestre</SelectItem>
              <SelectItem value="table">Mesa</SelectItem>
              <SelectItem value="store">Loja</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicadas</SelectItem>
              <SelectItem value="hidden">Ocultas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <MessageSquareText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma review encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                className={`rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${
                  r.status === "hidden" ? "border-destructive/20 opacity-70" : "border-border"
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating value={r.rating} size="sm" readonly />
                    <Badge variant="outline" className="text-[10px]">
                      {r.review_type === "gm" ? "Mestre" : r.review_type === "table" ? "Mesa" : "Loja"}
                    </Badge>
                    <Badge variant={r.status === "published" ? "default" : "destructive"} className="text-[10px]">
                      {r.status === "published" ? "Publicada" : "Oculta"}
                    </Badge>
                    {r.is_verified && (
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-500">
                        Verificada
                      </Badge>
                    )}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.comment}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === "published" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => toggleStatus(r.id, "hidden")}
                    >
                      <EyeOff className="h-3 w-3" /> Ocultar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => toggleStatus(r.id, "published")}
                    >
                      <Eye className="h-3 w-3" /> Publicar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
