import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import Instagram from "lucide-react/dist/esm/icons/instagram";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getInstagramUrl, getInstagramHandle } from "@/lib/instagram";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import socioLogo from "@/assets/socio-logo.svg";

const navLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Perfis", href: "#perfis" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
  { label: "Explorar", href: "/buscar" },
  { label: "Quem Somos", href: "/quem-somos" },
  { label: "Contato", href: "/contato" },
];

const roleToDash: Record<string, string> = {
  admin: "/admin",
  player: "/dashboard/jogador",
  gm: "/dashboard/mestre",
  store: "/dashboard/loja",
  brand: "/dashboard/marca",
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isHome = location.pathname === "/";

  useEffect(() => {
    let mounted = true;

    const loadAdminStatus = async () => {
      if (!user) {
        if (mounted) setIsAdmin(false);
        return;
      }

      const { data } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (mounted) setIsAdmin(!!data);
    };

    loadAdminStatus();
    return () => {
      mounted = false;
    };
  }, [user]);

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

  const userRole = user?.user_metadata?.role || "player";
  const dashPath = isAdmin ? "/admin" : roleToDash[userRole] || "/dashboard/jogador";
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "U";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = userName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
          <img src={socioLogo} alt="Sócio do Tabuleiro" className="h-10 w-10 object-contain" />
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-sm tracking-tight text-foreground">
              Sócio do Tabuleiro
            </span>
            <span className="text-[9px] font-medium text-muted-foreground tracking-wider uppercase">
              HIVIUM IA — by Sócio do Tabuleiro
            </span>
          </div>
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
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full p-1 pr-3 hover:bg-muted transition-colors">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={userName} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                    {userName}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52 p-2">
                <button
                  onClick={() => navigate(dashPath)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Meu Painel
                </button>
                <button
                  onClick={() => navigate("/perfil")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Meu Perfil
                </button>
                <button
                  onClick={() => navigate("/configuracoes")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Configurações
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground">
                Entrar
              </Button>
              <Button variant="gradient" size="sm" onClick={() => navigate("/cadastro")}>
                Entrar grátis
              </Button>
            </>
          )}
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
          <a
            href={getInstagramUrl("navbar_mobile")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Instagram className="h-4 w-4" />
            {getInstagramHandle()}
          </a>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3 mb-2 border border-border">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={userName} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground truncate">
                    {userName}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { navigate(dashPath); setOpen(false); }}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Meu Painel
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { handleLogout(); setOpen(false); }}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setOpen(false); }}>
                  Entrar
                </Button>
                <Button variant="gradient" size="sm" onClick={() => { navigate("/cadastro"); setOpen(false); }}>
                  Entrar grátis
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
