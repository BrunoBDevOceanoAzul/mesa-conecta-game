import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TableDetail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Mesa não encontrada</h1>
        <p className="text-muted-foreground mb-6">Esta mesa ainda não existe ou foi removida.</p>
        <Button variant="hero" onClick={() => navigate("/buscar")}>Buscar Mesas</Button>
      </div>
    </div>
  );
}
