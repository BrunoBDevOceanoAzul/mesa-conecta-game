import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Feed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-12">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Câmara da Comunidade</h1>
        <p className="text-sm text-muted-foreground mb-8">Publicações de mestres, luderias e marcas do ecossistema HIVIUM.</p>

        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-14 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <MessageCircle className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">Ainda sem publicações</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
            A câmara será alimentada por mestres, luderias e marcas. Enquanto isso, explore mesas curadas para você.
          </p>
          <Button variant="outline" onClick={() => navigate("/explorar")} className="gap-2">
            <Sparkles className="h-4 w-4" /> Explorar mesas
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
