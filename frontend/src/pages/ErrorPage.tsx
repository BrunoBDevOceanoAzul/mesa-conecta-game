import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mx-auto mb-5">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div className="font-display text-5xl font-bold text-foreground mb-2">500</div>
        <h1 className="text-lg font-display font-bold text-foreground mb-2">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Ocorreu um erro inesperado. Se o problema persistir, entre em contato com o suporte.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
}
