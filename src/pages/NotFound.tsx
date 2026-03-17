import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Compass, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="font-display text-7xl font-bold text-muted/30 mb-4">404</div>
        <h1 className="text-xl font-display font-bold text-foreground mb-2">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground mb-8">A página que você procura não existe ou foi movida.</p>
        <div className="flex flex-col gap-3">
          <Button variant="default" onClick={() => navigate("/")} className="gap-2">
            <Compass className="h-4 w-4" /> Ir para o início
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
