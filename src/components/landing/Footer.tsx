export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center font-display font-bold text-primary-foreground text-xs" style={{ backgroundImage: "linear-gradient(135deg, hsl(258 90% 66%), hsl(189 94% 43%))" }}>
              M
            </div>
            <span className="font-display font-semibold text-foreground">
              Mesa<span className="text-primary">Nexo</span>
            </span>
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 MesaNexo. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
