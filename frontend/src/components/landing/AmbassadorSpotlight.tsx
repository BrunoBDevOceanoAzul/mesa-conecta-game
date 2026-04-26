import { motion } from "framer-motion";
import ambassadorPhoto from "@/assets/ambassador-marcelo.png";

export function AmbassadorSpotlight() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />

      <div className="container mx-auto max-w-5xl px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-4">
            Embaixador
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Quem faz a HIVIUM acontecer
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-12 items-center rounded-2xl border border-border/60 bg-card p-6 sm:p-10"
        >
          {/* Photo */}
          <div className="mx-auto md:mx-0 w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/5 shrink-0">
            <img
              src={ambassadorPhoto}
              alt="Marcelo Marins — Embaixador HIVIUM"
              className="h-full w-full object-cover object-top"
              loading="lazy"
            />
          </div>

          {/* Story */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              Marcelo Marins
            </h3>
            <div className="space-y-3 text-sm sm:text-base leading-relaxed text-muted-foreground">
              <p>
                Começou no RPG ainda adolescente.
              </p>
              <p>
                E ali encontrou algo raro:{" "}
                <span className="text-foreground font-medium">
                  a chance de viver outras vidas dentro da própria.
                </span>
              </p>
              <p>
                Explorar mundos impossíveis, tomar decisões que nunca caberiam no dia a dia…
                e, no meio disso tudo, se descobrir.
              </p>
              <p className="text-foreground font-medium">
                São mais de 30 anos de mesa.
              </p>
              <p>Jogando. Narrando. Construindo histórias.</p>
              <p>
                Hoje, Marcelo cria{" "}
                <span className="text-primary font-semibold">jornadas que ficam</span>.
              </p>
              <p className="italic text-foreground/80">
                Daquelas em que personagens viram lenda… e a mesa nunca é esquecida.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
