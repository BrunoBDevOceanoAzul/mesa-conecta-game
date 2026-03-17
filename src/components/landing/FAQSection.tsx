import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "O que é o Sócio do Tabuleiro?",
    a: "A plataforma que conecta jogadores, mestres e luderias de RPG com matchmaking inteligente, CRM nativo e ferramentas de crescimento. Não somos diretório — somos ecossistema.",
  },
  {
    q: "Como funciona o matchmaking?",
    a: "Você responde uma anamnese sobre gostos, estilo, cidade e disponibilidade. O sistema cruza tudo e exibe um score de compatibilidade em cada mesa.",
  },
  {
    q: "Preciso pagar para jogar?",
    a: "Criar conta e navegar é grátis. Planos dão acesso a reservas, prioridade e ferramentas avançadas. O preço da sessão é do mestre.",
  },
  {
    q: "Sou mestre. Como ganho com a plataforma?",
    a: "Perfil profissional, mesas publicadas, reservas automáticas, CRM integrado. Com Pro+: analytics completo e impulsionamento.",
  },
  {
    q: "Como funciona o impulsionamento?",
    a: "Compre créditos, destaque mesas ou posts por 7 dias, pague por clique (CPC). Founders ganham 3 impulsos grátis/mês por 6 meses.",
  },
  {
    q: "Tenho uma luderia. O que ganho?",
    a: "Perfil, agenda pública, gestão de mesas, visibilidade regional e analytics. A partir de R$79,90/mês.",
  },
  {
    q: "O que é a anamnese?",
    a: "Questionário que mapeia seu perfil: sistemas, estilo, disponibilidade, orçamento e preferências. Alimenta matchmaking e CRM.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28 md:py-36 border-t border-border/50">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-label">FAQ</span>
          <h2 className="section-heading">
            Perguntas que <span className="gradient-text">importam</span>
          </h2>
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="rounded-xl border border-border bg-card/50 overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <button
                className="flex w-full items-center justify-between p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-foreground text-sm pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
