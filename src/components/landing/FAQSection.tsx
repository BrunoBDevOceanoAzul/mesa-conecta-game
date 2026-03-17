import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "O que é a MesaNexo?",
    a: "MesaNexo é a plataforma que conecta jogadores, mestres e luderias de RPG de mesa. Com matchmaking inteligente, reservas simples e ferramentas de gestão, facilitamos todo o ecossistema de RPG no Brasil.",
  },
  {
    q: "Como funciona o matchmaking?",
    a: "Ao criar sua conta, você responde uma anamnese sobre seus gostos, estilo de jogo, cidade e disponibilidade. Nosso sistema cruza essas informações e exibe um score de compatibilidade em cada mesa ou mestre.",
  },
  {
    q: "Preciso pagar para jogar?",
    a: "Criar conta e navegar é grátis. Os planos dão acesso a reservas, prioridade e ferramentas avançadas. O preço de cada sessão é definido pelo mestre.",
  },
  {
    q: "Sou mestre, como ganho com a plataforma?",
    a: "Você cria seu perfil profissional, publica mesas, recebe reservas e usa o CRM integrado para gerenciar seus jogadores. Com os planos Pro e Pro+, você tem analytics e impulsionamento.",
  },
  {
    q: "Como funciona o impulsionamento?",
    a: "Você compra créditos e usa para destacar suas mesas ou posts no feed. A campanha dura 7 dias e cobra por clique (CPC). Mestres Founders ganham impulsionamentos grátis nos primeiros 6 meses.",
  },
  {
    q: "Tenho uma luderia. O que ganho?",
    a: "Perfil da loja, agenda pública, gestão de mesas e capacidade, visibilidade para jogadores da região e analytics de desempenho. Planos a partir de R$79,90/mês.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 border-t border-border">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-display font-bold md:text-4xl">
            Perguntas <span className="gradient-text">frequentes</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="rounded-xl border border-border bg-card overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                className="flex w-full items-center justify-between p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-foreground pr-4">{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
