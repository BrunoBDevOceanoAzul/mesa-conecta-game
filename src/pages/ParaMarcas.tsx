import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Megaphone, TrendingUp, Users, Target, BarChart3, Star } from "lucide-react";

const features = [
  { icon: <Target className="h-6 w-6" />, title: "Segmentação Inteligente", desc: "Alcance jogadores, mestres e luderias por cidade, sistema favorito, nível de experiência e preferências." },
  { icon: <TrendingUp className="h-6 w-6" />, title: "Campanhas CPC", desc: "Pague por clique com orçamento controlado. Visibilidade real no feed e busca da plataforma." },
  { icon: <BarChart3 className="h-6 w-6" />, title: "Dashboard de Métricas", desc: "Impressões, cliques, CTR, conversões e ROI em tempo real. Dados que impulsionam decisões." },
  { icon: <Users className="h-6 w-6" />, title: "Comunidade Engajada", desc: "Mais de 1.000 usuários ativos que vivem e respiram RPG e jogos de tabuleiro." },
  { icon: <Star className="h-6 w-6" />, title: "Formatos Criativos", desc: "Posts patrocinados no feed, destaques em busca, banners contextuais e integrações nativas." },
  { icon: <Megaphone className="h-6 w-6" />, title: "Suporte Dedicado", desc: "Equipe de marketing ajuda a criar campanhas eficazes para o público tabletop." },
];

export default function ParaMarcas() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 text-center py-16">
          <span className="text-overline text-primary">Para Marcas & Anunciantes</span>
          <h1 className="text-display-lg text-foreground mt-3 max-w-3xl mx-auto">
            Conecte sua marca ao <span className="gradient-text">universo tabletop</span>
          </h1>
          <p className="text-body-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
            A Sócio do Tabuleiro reúne a comunidade mais engajada de RPG e jogos de tabuleiro do Brasil. Anuncie onde seu público já está.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button variant="gradient" size="lg" onClick={() => navigate("/interesse")}>
              Quero anunciar
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/contato")}>
              Falar com a equipe
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="text-sm font-display font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-border p-12">
            <h2 className="text-h2 text-foreground">Pronto para alcançar a comunidade tabletop?</h2>
            <p className="text-muted-foreground mt-2">Entre em contato e descubra como posicionar sua marca no ecossistema Sócio do Tabuleiro.</p>
            <Button variant="gradient" size="lg" className="mt-6" onClick={() => navigate("/contato")}>
              Iniciar Conversa
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
