import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, ChevronLeft, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logoImg from "@/assets/hivium-logo.png";

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Painel", path: "/admin", icon: "📊" },
  { label: "Insights", path: "/admin/insights", icon: "🧠" },
  { label: "Usuários", path: "/admin/usuarios", icon: "👥" },
  { label: "Reviews", path: "/admin/reviews", icon: "⭐" },
  { label: "Feedback", path: "/admin/feedback", icon: "🎯" },
  { label: "Campanha", path: "/admin/campanha", icon: "📣" },
  { label: "Social", path: "/admin/social", icon: "🔗" },
  { label: "Configurações", path: "/admin/configuracoes", icon: "⚙️" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 border-r border-border bg-card transform transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <img src={logoImg} alt="HIVIUM" className="h-7 w-7 object-contain" />
            <span className="font-display font-bold text-xs gradient-text tracking-wide">HIVIUM</span>
          </button>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-3 rounded-lg bg-surface p-3 mb-5">
            <div className="h-9 w-9 rounded-full bg-primary/12 flex items-center justify-center text-sm font-bold text-primary ring-1 ring-primary/15">
              <Shield className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.name || "Admin"}
              </div>
              <div className="text-overline text-muted-foreground mt-0.5">Administrador</div>
            </div>
          </div>

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
