import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MessageCircle } from "lucide-react";

export default function Feed() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-12">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Feed da Comunidade</h1>
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhuma publicação ainda. O feed será preenchido pela comunidade em breve!</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
