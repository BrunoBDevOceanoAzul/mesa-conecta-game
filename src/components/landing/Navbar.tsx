import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logoImg from "@/assets/hivium-logo.png";

const navLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Perfis", href: "#perfis" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
  { label: "Explorar", href: "/buscar" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      if (!isHome) {
        navigate("/" + href);
      }
    } else {
      navigate(href);
    }
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
          <img src={logoImg} alt="HIVIUM" className="h-9 w-9 object-contain" />
          <span className="font-display font-bold text-base tracking-tight gradient-text">
            HIVIUM
          </span>
        </button>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href.startsWith("#") ? l.href : undefined}
              onClick={(e) => {
                if (!l.href.startsWith("#")) { e.preventDefault(); handleNavClick(l.href); }
              }}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground">
            Entrar
          </Button>
          <Button variant="default" size="sm" onClick={() => navigate("/cadastro")}>
            Criar conta
          </Button>
        </div>

        {/* Mobile */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-card border-t border-border px-4 pb-4 animate-fade-in">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href.startsWith("#") ? l.href : undefined}
              onClick={(e) => {
                if (!l.href.startsWith("#")) { e.preventDefault(); }
                handleNavClick(l.href);
              }}
              className="block py-2.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setOpen(false); }}>
              Entrar
            </Button>
            <Button variant="default" size="sm" onClick={() => { navigate("/cadastro"); setOpen(false); }}>
              Criar conta
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
