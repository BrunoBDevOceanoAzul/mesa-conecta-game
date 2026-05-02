import { useRouter } from "next/router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Compass, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const router = useRouter();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", router.pathname);
  }, [router.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="font-display text-7xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-xl font-display font-bold text-foreground mb-2">Território desconhecido</h1>
        <p className="text-sm text-muted-foreground mb-8">A página que você procura não existe ou foi movida. Volte para o mapa.</p>
        <div className="flex flex-col gap-3">
          <Button variant="default" onClick={() => router.push("/")} className="gap-2">
            <Compass className="h-4 w-4" /> Ir para o início
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
