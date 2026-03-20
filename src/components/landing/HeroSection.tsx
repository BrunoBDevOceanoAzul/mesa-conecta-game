import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-rpg-table.jpg";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-20 pb-12 sm:pt-16 sm:pb-0">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Mesa de RPG com dados, miniaturas e fichas de personagens"
          className="h-full w-full object-cover"
          loading="eager"
        />
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
      </div>

      <div className="container relative mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text content — left side */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="section-label">Curadoria · Conexão · Prestígio</span>
          </motion.div>

          <motion.h1
            className="max-w-2xl text-3xl font-display font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-foreground"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Onde mesas certas{" "}
            <br className="hidden sm:block" />
            <span className="gradient-text">encontram pessoas certas.</span>
          </motion.h1>

          <motion.p
            className="mt-6 sm:mt-8 max-w-xl text-base text-muted-foreground sm:text-lg md:text-xl leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            Menos ruído. Mais aderência.{" "}
            <span className="text-foreground/70">
              A HIVIUM cruza perfis, estilo de jogo e disponibilidade para criar matches reais entre jogadores, mestres e luderias.
            </span>
          </motion.p>

          <motion.div
            className="mt-12 flex flex-col items-start gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button variant="gradient" size="xl" onClick={() => navigate("/cadastro")}>
              Criar acesso grátis
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="hero-outline" size="xl" onClick={() => navigate("/explorar")}>
              Explorar mesas
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {[
              { value: "RPG", label: "Curadoria de mesas" },
              { value: "100%", label: "Match inteligente" },
              { value: "CRM", label: "Para mestres" },
              { value: "Boost", label: "Para luderias" },
            ].map((s) => (
              <div key={s.label} className="text-left">
                <div className="font-display text-2xl font-bold text-foreground md:text-3xl">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right side — visible image card on large screens */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <img
              src={heroImg}
              alt="Mesa de RPG em ação"
              className="w-full aspect-[4/3] object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
          </div>
        </motion.div>
      </div>

      {/* Bottom tagline */}
      <motion.p
        className="absolute bottom-8 left-0 right-0 text-center text-xs text-muted-foreground/50 tracking-[0.15em] uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        Toda grande mesa começa com a combinação certa
      </motion.p>
    </section>
  );
}
