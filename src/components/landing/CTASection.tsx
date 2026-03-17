import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-28 md:py-36 border-t border-border/50">
      <div className="container mx-auto px-4">
        <motion.div
          className="relative mx-auto max-w-3xl rounded-3xl border border-primary/15 bg-card/80 p-12 md:p-20 text-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />

          <div className="relative">
            <span className="section-label">Pronto?</span>

            <h2 className="text-3xl font-display font-bold md:text-5xl text-foreground leading-tight mt-2">
              A mesa certa existe.<br />
              <span className="gradient-text">Ela só precisa te encontrar.</span>
            </h2>

            <p className="mt-6 text-muted-foreground max-w-md mx-auto">
              RPG é comunidade, profissão e mercado. HIVIUM organiza o jogo social.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="xl" onClick={() => navigate("/cadastro")}>
                Começar agora — é grátis
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="lg" onClick={() => navigate("/buscar")}>
                Explorar mesas
              </Button>
            </div>

            <p className="mt-8 text-xs text-muted-foreground/40">
              Sem cartão. Sem compromisso.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
