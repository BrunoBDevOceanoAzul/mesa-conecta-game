import logoImg from "@/assets/logo-socio-tabuleiro.png";

export function Footer() {
  return (
    <footer className="border-t border-border py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Sócio do Tabuleiro" className="h-8 w-8 object-contain" />
            <span className="font-display font-semibold text-foreground">
              Sócio do <span className="text-primary">Tabuleiro</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#perfis" className="hover:text-primary transition-colors">Para quem</a>
            <a href="#planos" className="hover:text-primary transition-colors">Planos</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Contato</a>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 Sócio do Tabuleiro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
