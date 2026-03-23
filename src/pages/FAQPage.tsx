import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { FAQSection } from "@/components/landing/FAQSection";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-h1 text-foreground">Perguntas Frequentes</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Tudo o que você precisa saber sobre a Sócio do Tabuleiro — HIVIUM IA.
            </p>
          </div>
          <FAQSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
