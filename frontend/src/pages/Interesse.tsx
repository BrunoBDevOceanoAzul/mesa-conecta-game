import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, Crown, Store, Sparkles, ChevronDown, Instagram, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterestForm } from "@/components/campaign/InterestForm";
import { ThankYouScreen } from "@/components/campaign/ThankYouScreen";
import campaignHero from "@/assets/campaign-hero.jpg";
import logo from "@/assets/hivium-logo.png";

export default function Interesse() {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Capture UTM params
  const [utm, setUtm] = useState({ source: "", medium: "", campaign: "" });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtm({
      source: params.get("utm_source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
    });
  }, []);

  if (submitted) return <ThankYouScreen />;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <img src={logo} alt="HIVIUM" className="h-8" />
          <Button size="sm" onClick={() => { setShowForm(true); document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" }); }}>
            Quero fazer parte
          </Button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={campaignHero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="relative z-10 container max-w-4xl mx-auto px-4 text-center py-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="text-overline text-secondary mb-6 tracking-[0.2em]">ACESSO ANTECIPADO</p>
            <h1 className="text-display-xl mb-6">
              Se a mesa certa existisse{" "}
              <span className="gradient-text">para você</span>,{" "}
              <br className="hidden md:block" />
              você entraria?
            </h1>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Estamos construindo o ecossistema que conecta jogadores, mestres e lojas de RPG & board games.
              Responda em poucos minutos e ajude a moldar a HIVIUM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 cta-glow"
                onClick={() => {
                  setShowForm(true);
                  setTimeout(() => document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" }), 100);
                }}
              >
                Quero fazer parte <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="mt-16 animate-bounce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 2 }}
          >
            <ChevronDown className="h-6 w-6 mx-auto text-muted-foreground" />
          </motion.div>
        </div>
      </section>

      {/* ── O QUE É ── */}
      <section className="py-20 md:py-28">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="section-label">O que é a HIVIUM</p>
            <h2 className="section-heading mb-6">
              Uma nova forma de <span className="gradient-text">descobrir, organizar e lotar</span> mesas
            </h2>
            <p className="section-subheading">
              A HIVIUM conecta quem joga, quem mestra e quem oferece o espaço.
              Com curadoria inteligente, gestão profissional e uma comunidade que se encontra de verdade.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users className="h-7 w-7" />,
                title: "Jogadores",
                desc: "Encontre mesas que combinam com seu estilo, agenda e orçamento. Sem procurar em grupos aleatórios.",
                color: "text-primary",
                bg: "bg-primary/10",
              },
              {
                icon: <Crown className="h-7 w-7" />,
                title: "Mestres",
                desc: "Gerencie suas mesas, atraia jogadores certos, receba pagamentos e cresça como profissional.",
                color: "text-secondary",
                bg: "bg-secondary/10",
              },
              {
                icon: <Store className="h-7 w-7" />,
                title: "Lojas & Luderias",
                desc: "Organize agenda, comunidade e ocupação do espaço. Atraia mestres e jogadores qualificados.",
                color: "text-accent",
                bg: "bg-accent/10",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="surface-card-elevated text-center group hover:border-border-strong transition-all"
              >
                <div className={`${card.bg} ${card.color} h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-5`}>
                  {card.icon}
                  </div>
                <h3 className="text-h4 mb-3">{card.title}</h3>
                <p className="text-body-sm text-muted-foreground">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULÁRIO ── */}
      <section id="form-section" className="py-20 md:py-28 scroll-mt-20">
        <div className="container max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="section-label">Formulário de interesse</p>
            <h2 className="section-heading mb-4">
              Conte pra gente <span className="gradient-text">sobre você</span>
            </h2>
            <p className="section-subheading">
              Leva poucos minutos. Suas respostas nos ajudam a construir algo realmente útil.
            </p>
          </motion.div>

          <InterestForm utm={utm} onSuccess={() => setSubmitted(true)} />
        </div>
      </section>

      {/* ── ENCERRAMENTO ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <Sparkles className="h-8 w-8 text-secondary mx-auto mb-6" />
          <h2 className="section-heading mb-4">
            Os primeiros terão <span className="gradient-text-gold">prioridade</span>
          </h2>
          <p className="section-subheading mb-8">
            Quem responder agora entra no primeiro círculo de interesse da HIVIUM e terá acesso antecipado, condições especiais e voz ativa na construção do produto.
          </p>
          <Button
            size="lg"
            className="cta-glow"
            onClick={() => document.getElementById("form-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            Responder agora <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-8">
        <div className="container max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-caption">
          <img src={logo} alt="HIVIUM" className="h-6 opacity-60" />
          <p>© {new Date().getFullYear()} HIVIUM. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="/termos" className="hover:text-foreground transition-colors">Termos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
