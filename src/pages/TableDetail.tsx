import { useParams, useNavigate } from "react-router-dom";
import { mockTables } from "@/data/mock";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MatchBadge } from "@/components/shared/MatchBadge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Users, ArrowLeft } from "lucide-react";

export default function TableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const table = mockTables.find((t) => t.id === id);

  if (!table) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Mesa não encontrada.</div>;

  const date = new Date(table.startAt);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 pt-24 pb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{table.system}</span>
              <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{table.sessionType}</span>
            </div>
            <MatchBadge score={table.matchScore} size="lg" />
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2">{table.title}</h1>
          <p className="text-muted-foreground leading-relaxed mb-6">{table.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: <MapPin className="h-4 w-4" />, label: table.city, sub: table.venue },
              { icon: <Calendar className="h-4 w-4" />, label: date.toLocaleDateString("pt-BR"), sub: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
              { icon: <Users className="h-4 w-4" />, label: `${table.seatsAvailable} vagas`, sub: `de ${table.seatsTotal}` },
              { icon: <Clock className="h-4 w-4" />, label: table.format, sub: `R$${table.minPrice}${table.maxPrice !== table.minPrice ? `–${table.maxPrice}` : ""}` },
            ].map((item, i) => (
              <div key={i} className="rounded-lg bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm text-foreground mb-0.5">{item.icon}{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-muted/20 border border-border">
            <div className="h-11 w-11 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">{table.gmName.charAt(0)}</div>
            <div>
              <div className="text-sm font-semibold text-foreground">{table.gmName}</div>
              <div className="text-xs text-muted-foreground">Mestre</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {table.tags.map((tag) => <span key={tag} className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">{tag}</span>)}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="hero" size="lg" className="flex-1" onClick={() => navigate("/checkout/" + table.id)}>
              Reservar vaga · R${table.minPrice}
            </Button>
            <Button variant="outline" size="lg">Salvar</Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
