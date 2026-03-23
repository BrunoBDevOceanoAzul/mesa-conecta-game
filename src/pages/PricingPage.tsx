import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PricingSection } from "@/components/landing/PricingSection";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-h1 text-foreground">Planos e Preços</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Escolha o plano ideal para sua jornada no universo tabletop.
            </p>
          </div>
          <PricingSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
