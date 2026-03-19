import { Instagram } from "lucide-react";
import logoImg from "@/assets/hivium-logo.png";
import { getInstagramUrl, getInstagramHandle } from "@/lib/instagram";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-10 bg-card">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="HIVIUM" className="h-7 w-7 object-contain" />
            <span className="font-display font-bold text-sm gradient-text">
              HIVIUM
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <a href="#perfis" className="hover:text-foreground transition-colors">Para quem</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="/termos" className="hover:text-foreground transition-colors">Termos</a>
            <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={getInstagramUrl("footer")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-plum-500 transition-colors"
            >
              <Instagram className="h-4 w-4" />
              {getInstagramHandle()}
            </a>
            <p className="text-[11px] text-muted-foreground/50">
              © 2026 HIVIUM
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
