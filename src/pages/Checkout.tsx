import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Checkout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Checkout indisponível</h1>
        <p className="text-muted-foreground mb-6">Nenhuma mesa selecionada para reserva.</p>
        <Button variant="hero" onClick={() => navigate("/buscar")}>Buscar Mesas</Button>
      </div>
    </div>
  );
}
