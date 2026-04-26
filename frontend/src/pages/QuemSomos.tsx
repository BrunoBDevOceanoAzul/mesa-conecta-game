import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Instagram, Linkedin, ExternalLink } from "lucide-react";
import founderImg from "@/assets/founder-bruno.png";

const INSTAGRAM_URL = "https://www.instagram.com/brunobisogni2/";
const LINKEDIN_URL = "https://www.linkedin.com/in/brunobisogni";

const timelineEvents = [
  {
    year: "2022",
    label: "A Centelha",
    text: "Nasce a Sócio do Tabuleiro — uma loja de aluguel de jogos de tabuleiro em Campinas. Não era só um negócio. Era a convicção de que pessoas sentadas ao redor de uma mesa podem criar algo que nenhum algoritmo replica: conexão real.",
  },
  {
    year: "Jul 2023",
    label: "O MVP",
    text: "A plataforma ganha vida: aluguel de jogos premium com entrega via motoboy, locadores recebendo 85% direto na carteira. De Gloomhaven a Catan, o catálogo cresce — e com ele, a comunidade.",
  },
  {
    year: "Out 2023",
    label: "A Voz do Nicho",
    text: "Participação no episódio #26 do podcast 'É a Minha Vez!' (Viver de Jogo). A primeira vez contando a história para o ecossistema — dúvidas, tropeços e aprendizados expostos sem filtro.",
  },
  {
    year: "Nov 2023",
    label: "O Cadinho",
    text: "Turma Summer 2023 do Founder Institute São Paulo. Pitch final no Inova Habitat. Pessoas que marcaram profundamente a trajetória da empresa e do fundador. Um dos períodos mais transformadores — onde paixão encontrou método.",
  },
  {
    year: "Mar 2024",
    label: "A Aposta do Google",
    text: "Selecionados para o programa Beta do Google for Startups Cloud, dentro do Google Campus. A startup que mais evoluiu tecnicamente em todo o batch. Prova de que convicção, quando encontra execução, chama atenção.",
  },
  {
    year: "Jul 2024",
    label: "O Redesenho",
    text: "Primeira turma mundial de Advisor de Startup pelo Founder Institute São Paulo. Foi aqui que o negócio foi redesenhado por completo — modelo, visão, proposta de valor. Mais que uma empresa, uma tese sobre comunidade.",
  },
  {
    year: "2024",
    label: "Incubação",
    text: "Selecionados pela IMA junto ao Sebrae para o programa de incubação IMATECH. E depois, para o Sebrae for Startups — Primeiras Vendas. Cada porta que se abriu confirmou: a direção estava certa.",
  },
  {
    year: "2025",
    label: "HIVIUM Beta",
    text: "A HIVIUM nasce da Sócio do Tabuleiro — do aluguel de jogos ao ecossistema completo para RPG e board games. Match de perfil, agendamento de mesas, gamificação, pagamento integrado. Ainda é o começo — e é exatamente isso que o torna emocionante.",
  },
];

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function QuemSomos() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.span
            className="section-label"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            Quem Somos
          </motion.span>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-[1.08] tracking-tight text-foreground mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
          >
            Não vendemos jogos.{" "}
            <span className="gradient-text">Construímos mesas.</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: easeOut }}
          >
            A HIVIUM nasceu de uma verdade simples: as melhores experiências da vida
            acontecem quando pessoas se sentam juntas. Tudo que construímos existe para que
            mais mesas existam no mundo.
          </motion.p>
        </div>
      </section>

      {/* Founder */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            className="flex flex-col md:flex-row gap-10 items-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            {/* Avatar placeholder — initials */}
            <div className="shrink-0 h-36 w-36 rounded-2xl overflow-hidden border border-primary/20">
              <img src={founderImg} alt="Bruno Bisogni, Fundador da HIVIUM" className="h-full w-full object-cover object-top" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="font-display text-2xl font-bold text-foreground">Bruno Bisogni</h2>
              <p className="text-sm text-muted-foreground mt-1">Fundador & CEO</p>

              <p className="mt-4 text-muted-foreground leading-relaxed text-sm max-w-xl">
                Empreendedor, advisor de startups e apaixonado por comunidades de jogos de tabuleiro e RPG.
                Fundou a Sócio do Tabuleiro, passou pelo Founder Institute, Google for Startups e Sebrae — 
                e transformou cada aprendizado na construção da HIVIUM.
              </p>

              <div className="mt-5 flex items-center gap-4 justify-center md:justify-start">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  @brunobisogni2
                </a>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            <span className="section-label">Nossa Jornada</span>
            <h2 className="section-heading mt-3">
              Cada mesa conta uma história.{" "}
              <span className="gradient-text">Esta é a nossa.</span>
            </h2>
          </motion.div>

          {/* Timeline line */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-12 md:space-y-16">
              {timelineEvents.map((ev, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <motion.div
                    key={ev.year}
                    className={`relative flex flex-col md:flex-row items-start gap-6 ${
                      isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                    initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: easeOut }}
                  >
                    {/* Dot */}
                    <div className="absolute left-6 md:left-1/2 -translate-x-1/2 mt-1.5">
                      <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    </div>

                    {/* Content card */}
                    <div
                      className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${
                        isLeft ? "md:pr-8 md:text-right" : "md:pl-8 md:text-left"
                      }`}
                    >
                      <span className="inline-block text-xs font-bold tracking-wider uppercase text-primary mb-1">
                        {ev.year}
                      </span>
                      <h3 className="font-display text-lg font-bold text-foreground">{ev.label}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {ev.text}
                      </p>
                    </div>

                    {/* Spacer on opposite side */}
                    <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy quote */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <motion.blockquote
            className="font-display text-xl md:text-2xl font-medium italic text-foreground leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            "Empreender é continuar mesmo sem garantia. É recalcular rota sem abandonar o sonho.
            É sentir medo e ainda assim seguir. Resiliência não é discurso — é prática diária."
          </motion.blockquote>
          <motion.p
            className="mt-4 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            — Bruno Bisogni, Fundador da HIVIUM
          </motion.p>
        </div>
      </section>

      {/* Made with love footer note */}
      <div className="text-center py-6 border-t border-border/30">
        <p className="text-xs text-muted-foreground/70">
          Feito com ❤️ pela Sócio do Tabuleiro
        </p>
      </div>

      <Footer />
    </div>
  );
}
