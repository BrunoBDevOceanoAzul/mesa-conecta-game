import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          className="relative mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-card p-12 text-center overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="absolute inset-0 bg-primary/5" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="relative">
            <h2 className="text-3xl font-display font-bold md:text-4xl text-foreground">
              Pronto para encontrar sua{" "}
              <span className="gradient-text">próxima aventura</span>?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Junte-se a milhares de jogadores, mestres e luderias que já estão
              na MesaNexo.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" onClick={() => navigate("/cadastro")}>
                Quero entrar na MesaNexo
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="lg" onClick={() => navigate("/buscar")}>
                Explorar mesas
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
