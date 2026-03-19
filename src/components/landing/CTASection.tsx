import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getInstagramUrl, getInstagramHandle } from "@/lib/instagram";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section
      className="py-28 md:py-36 border-t border-border/50"
      style={{ background: "var(--gradient-community)" }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          className="relative mx-auto max-w-3xl rounded-3xl border border-plum-100 bg-card p-12 md:p-20 text-center overflow-hidden shadow-lg"
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-plum-300/40 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-gold-300/30 to-transparent" />

          <div className="relative">
            <span className="section-label">Pronto?</span>

            <h2 className="text-3xl font-display font-bold md:text-5xl text-foreground leading-tight mt-2">
              A mesa certa existe.<br />
              <span className="gradient-text">Ela só precisa te encontrar.</span>
            </h2>

            <p className="mt-6 text-muted-foreground max-w-md mx-auto">
              RPG é comunidade, profissão e mercado. A HIVIUM organiza o jogo social.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gradient" size="xl" onClick={() => navigate("/cadastro")}>
                Entrar no ecossistema
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="xl" onClick={() => navigate("/explorar")}>
                Explorar mesas
              </Button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
              <a
                href={getInstagramUrl("cta_section")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                <Instagram className="h-3.5 w-3.5" />
                Siga {getInstagramHandle()} no Instagram
              </a>
              <p className="text-xs text-muted-foreground/50">
                Sem cartão. Sem compromisso. Comece agora.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
