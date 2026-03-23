import { Instagram } from "lucide-react";
import socioLogo from "@/assets/socio-logo.svg";
import { getInstagramUrl, getInstagramHandle } from "@/lib/instagram";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-10 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src={socioLogo} alt="Sócio do Tabuleiro" className="h-8 w-8 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-sm text-foreground">
                Sócio do Tabuleiro
              </span>
              <span className="text-[8px] font-medium text-muted-foreground tracking-wider uppercase">
                Powered by HIVIUM IA
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <a href="#perfis" className="hover:text-foreground transition-colors">Para quem</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="/faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="/quem-somos" className="hover:text-foreground transition-colors">Quem Somos</a>
            <a href="/termos" className="hover:text-foreground transition-colors">Termos</a>
            <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="/suporte" className="hover:text-foreground transition-colors">Suporte</a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={getInstagramUrl("footer")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="h-4 w-4" />
              {getInstagramHandle()}
            </a>
            <p className="text-[11px] text-muted-foreground/50">
              © 2026 Sócio do Tabuleiro
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/30 text-center">
          <p className="text-[10px] text-muted-foreground/40">
            Feito com ❤️ pela Sócio do Tabuleiro · Inteligência artificial por HIVIUM IA
          </p>
        </div>
      </div>
    </footer>
  );
}
