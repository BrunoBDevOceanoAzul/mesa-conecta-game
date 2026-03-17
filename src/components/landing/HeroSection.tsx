import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-16">
      {/* BG effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/5 h-[400px] w-[400px] rounded-full bg-secondary/8 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-primary/3 blur-[200px]" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>A plataforma de RPG que faltava no Brasil</span>
          </div>
        </motion.div>

        <motion.h1
          className="mx-auto max-w-5xl text-4xl font-display font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Encontre a mesa certa.{" "}
          <br className="hidden sm:block" />
          <span className="gradient-text">Lote suas sessões.</span>{" "}
          <br className="hidden sm:block" />
          Organize sua luderia.
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          Não vendemos só vagas. Vendemos encaixe.{" "}
          <span className="text-foreground/80">
            Hivium cruza perfis, estilo de jogo e disponibilidade para criar matches reais entre jogadores, mestres e luderias.
          </span>
        </motion.p>

        <motion.div
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button variant="gradient" size="xl" onClick={() => navigate("/cadastro")}>
            Começar grátis
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button variant="hero-outline" size="xl" onClick={() => navigate("/buscar")}>
            Explorar mesas
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 mx-auto max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {[
            { value: "600+", label: "Sistemas cadastrados" },
            { value: "200+", label: "Mesas ativas" },
            { value: "1.2k", label: "Jogadores" },
            { value: "50+", label: "Luderias" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl font-bold text-foreground md:text-3xl">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Trust line */}
        <motion.p
          className="mt-12 text-xs text-muted-foreground/60 tracking-wide uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          Menos vaga vazia. Mais campanhas vivas.
        </motion.p>
      </div>
    </section>
  );
}
