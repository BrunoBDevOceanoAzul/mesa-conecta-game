import { useParams, useNavigate } from "react-router-dom";
import { mockTables } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const table = mockTables.find((t) => t.id === id);
  const [done, setDone] = useState(false);

  if (!table) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Mesa não encontrada.</div>;

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <Check className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Reserva confirmada! 🎉</h1>
          <p className="text-muted-foreground mb-6">Sua vaga em <strong className="text-foreground">{table.title}</strong> está garantida.</p>
          <Button variant="hero" onClick={() => navigate("/dashboard/jogador")}>Ir para o Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Confirmar Reserva</h1>
        <p className="text-muted-foreground mb-6">Revise os detalhes antes de confirmar.</p>

        <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-3">
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Mesa</span><span className="text-sm text-foreground font-medium">{table.title}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Sistema</span><span className="text-sm text-foreground">{table.system}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Data</span><span className="text-sm text-foreground">{new Date(table.startAt).toLocaleDateString("pt-BR")}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Mestre</span><span className="text-sm text-foreground">{table.gmName}</span></div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="text-lg font-display font-bold text-primary">R${table.minPrice},00</span>
          </div>
        </div>

        <Button variant="gradient" size="lg" className="w-full" onClick={() => setDone(true)}>
          Confirmar e Pagar (Simulado)
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-3">Pagamento simulado para MVP. Nenhuma cobrança real será feita.</p>
      </div>
    </div>
  );
}
