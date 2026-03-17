import logoImg from "@/assets/logo-socio-tabuleiro.png";

export function Footer() {
  return (
    <footer className="border-t border-border/50 py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src={logoImg} alt="Sócio do Tabuleiro" className="h-7 w-7 object-contain" />
            <span className="font-display font-semibold text-sm text-foreground">
              Sócio do <span className="text-primary">Tabuleiro</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <a href="#perfis" className="hover:text-foreground transition-colors">Para quem</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
          </div>

          <p className="text-[11px] text-muted-foreground/50">
            © 2026 Sócio do Tabuleiro
          </p>
        </div>
      </div>
    </footer>
  );
}
