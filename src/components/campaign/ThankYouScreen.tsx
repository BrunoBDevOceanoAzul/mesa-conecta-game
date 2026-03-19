import { motion } from "framer-motion";
import { CheckCircle2, Instagram, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/hivium-logo.png";
import { getInstagramUrl, getInstagramHandle } from "@/lib/instagram";

export function ThankYouScreen() {
  const shareUrl = window.location.origin + "/interesse";
  const shareText = "Acabei de entrar na lista de interesse da HIVIUM — a plataforma que vai conectar jogadores, mestres e lojas de RPG & board games. Entra também:";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full text-center"
      >
        <div className="surface-card-elevated p-8 md:p-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-6" />
          </motion.div>

          <img src={logo} alt="HIVIUM" className="h-8 mx-auto mb-6 opacity-80" />

          <h1 className="text-h1 mb-4">
            Você entrou no <span className="gradient-text-gold">primeiro círculo</span>
          </h1>

          <p className="text-body text-muted-foreground mb-3">
            Obrigado por dedicar seu tempo. Suas respostas são valiosas para moldar a HIVIUM.
          </p>
          <p className="text-body-sm text-muted-foreground mb-8">
            Os primeiros inscritos terão acesso antecipado, condições especiais e voz ativa na construção do produto. Fique de olho no seu e-mail.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                navigator.share?.({ title: "HIVIUM", text: shareText, url: shareUrl })
                  .catch(() => navigator.clipboard.writeText(shareUrl));
              }}
            >
              <Share2 className="mr-2 h-4 w-4" /> Compartilhar
            </Button>
            <Button
              variant="outline"
              asChild
            >
              <a href="https://instagram.com/hivium.gg" target="_blank" rel="noopener noreferrer">
                <Instagram className="mr-2 h-4 w-4" /> Seguir no Instagram
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
