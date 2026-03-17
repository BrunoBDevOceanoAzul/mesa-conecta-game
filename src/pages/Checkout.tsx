import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default function Checkout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <ShoppingCart className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-display font-bold text-foreground mb-2">Checkout indisponível</h1>
        <p className="text-sm text-muted-foreground mb-8">Nenhuma mesa selecionada. Explore mesas disponíveis e reserve sua vaga.</p>
        <div className="flex flex-col gap-3">
          <Button variant="default" onClick={() => navigate("/buscar")}>Explorar Mesas</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
