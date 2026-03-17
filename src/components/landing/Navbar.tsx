import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Perfis", href: "#perfis" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-display font-bold text-primary-foreground text-sm" style={{ backgroundImage: "linear-gradient(135deg, hsl(258 90% 66%), hsl(189 94% 43%))" }}>
            M
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            Mesa<span className="text-primary">Nexo</span>
          </span>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Entrar
          </Button>
          <Button variant="hero" size="sm" onClick={() => navigate("/cadastro")}>
            Quero entrar na MesaNexo
          </Button>
        </div>

        {/* Mobile */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-border px-4 pb-4">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="block py-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setOpen(false); }}>
              Entrar
            </Button>
            <Button variant="hero" size="sm" onClick={() => { navigate("/cadastro"); setOpen(false); }}>
              Quero entrar na MesaNexo
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
