import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-16">
      {/* BG effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/6 blur-[180px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-secondary/5 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(270_55%_50%/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(270_55%_50%/0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">Curadoria · Conexão · Prestígio</span>
        </motion.div>

        <motion.h1
          className="mx-auto max-w-5xl text-4xl font-display font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Onde mesas certas{" "}
          <br className="hidden sm:block" />
          <span className="gradient-text">encontram pessoas certas.</span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed"
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
          className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button variant="gradient" size="xl" onClick={() => navigate("/cadastro")}>
            Entrar no ecossistema
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button variant="hero-outline" size="xl" onClick={() => navigate("/explorar")}>
            Explorar mesas
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          className="mt-24 grid grid-cols-2 sm:grid-cols-4 gap-8 mx-auto max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {[
            { value: "600+", label: "Sistemas" },
            { value: "200+", label: "Mesas curadas" },
            { value: "1.2k", label: "Membros" },
            { value: "50+", label: "Luderias" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-foreground md:text-4xl">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.p
          className="mt-16 text-xs text-muted-foreground/40 tracking-[0.15em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          Toda grande mesa começa com a combinação certa
        </motion.p>
      </div>
    </section>
  );
}
