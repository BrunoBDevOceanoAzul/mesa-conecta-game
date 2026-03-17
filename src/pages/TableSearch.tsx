import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Search } from "lucide-react";

export default function TableSearch() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 pt-24 pb-12">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Buscar Mesas</h1>
        <p className="text-muted-foreground mb-8">Encontre a mesa perfeita para você.</p>

        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma mesa disponível no momento. Volte em breve!</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
