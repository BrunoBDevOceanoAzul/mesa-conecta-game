import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-28 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          className="relative mx-auto max-w-4xl rounded-3xl border border-primary/20 bg-card p-12 md:p-16 text-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          {/* Glow effects */}
          <div className="absolute inset-0 bg-primary/3" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

          <div className="relative">
            <motion.p
              className="text-sm font-medium text-primary mb-4 tracking-wide uppercase"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Pronto para começar?
            </motion.p>

            <h2 className="text-3xl font-display font-bold md:text-5xl text-foreground leading-tight">
              A mesa certa existe.<br />
              <span className="gradient-text">Ela só precisa te encontrar.</span>
            </h2>

            <p className="mt-6 text-muted-foreground max-w-lg mx-auto text-lg">
              Jogadores, mestres e luderias que entendem que RPG é mais que hobby — é comunidade, é profissão, é mercado.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="xl" onClick={() => navigate("/cadastro")}>
                Começar grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="lg" onClick={() => navigate("/buscar")}>
                Explorar mesas
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground/60">
              Sem cartão de crédito. Sem compromisso. Sua aventura começa agora.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
