import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MessageCircle, Sparkles, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePosts } from "@/hooks/use-posts";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { CreatePostDialog } from "@/components/feed/CreatePostDialog";
import { useAuth } from "@/contexts/AuthContext";

const FILTER_TABS = [
  { key: "all", label: "Todos" },
  { key: "gm", label: "Mestres", filterKey: "role" },
  { key: "store", label: "Luderias", filterKey: "role" },
  { key: "table_announcement", label: "Mesas", filterKey: "postType" },
  { key: "event", label: "Eventos", filterKey: "postType" },
  { key: "sponsored", label: "Destaques", filterKey: "sponsored" },
  { key: "institutional", label: "HIVIUM", filterKey: "postType" },
] as const;

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    document.title = "Blog & Comunidade | HIVIUM — RPG e Jogos de Mesa";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Descubra posts, eventos e novidades do ecossistema HIVIUM. Mestres, luderias e jogadores compartilham experiências.");
  }, []);

  const filters = (() => {
    const tab = FILTER_TABS.find((t) => t.key === activeFilter);
    if (!tab || activeFilter === "all") return {};
    if ("filterKey" in tab) {
      if (tab.filterKey === "role") return { role: tab.key };
      if (tab.filterKey === "postType") {
        // Map frontend post types to API types
        const typeMap: Record<string, string> = {
          table_announcement: "mesa_share",
          event: "event",
          institutional: "announcement",
        };
        return { type: typeMap[tab.key] || tab.key };
      }
      if (tab.filterKey === "sponsored") return { sponsored: true };
    }
    return {};
  })();

  const { posts, loading, error, refetch } = usePosts({
    limit: 50,
    role: filters.role,
    type: filters.type,
    sponsored: filters.sponsored,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-display font-bold text-foreground">Câmara da Comunidade</h1>
          <CreatePostDialog onCreated={refetch} />
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Descubra o que está movimentando o ecossistema HIVIUM.
        </p>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all border ${
                activeFilter === tab.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-border-strong hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-14 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <MessageCircle className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">
              {activeFilter === "all" ? "Ainda sem publicações" : "Nenhum post neste filtro"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              {activeFilter === "all"
                ? "A câmara será alimentada por mestres, luderias e marcas. Enquanto isso, explore mesas curadas para você."
                : "Tente outro filtro ou explore o feed completo."}
            </p>
            <div className="flex items-center justify-center gap-3">
              {activeFilter !== "all" && (
                <Button variant="ghost" onClick={() => setActiveFilter("all")} className="gap-2">
                  <Filter className="h-4 w-4" /> Ver todos
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/explorar")} className="gap-2">
                <Sparkles className="h-4 w-4" /> Explorar mesas
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <FeedPostCard key={post.id} post={post} onLikeToggle={() => {}} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
