import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, ChevronLeft } from "lucide-react";
import type { UserRole } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ChatBadge } from "@/components/chat/ChatBadge";
import logoImg from "@/assets/hivium-logo.png";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  role: UserRole | "admin";
  navItems: NavItem[];
  userName?: string;
}

const roleLabels: Record<UserRole | "admin", string> = {
  player: "Jogador",
  gm: "Mestre",
  store: "Luderia",
  brand: "Marca",
  admin: "Administrador",
};

export function DashboardLayout({
  children,
  role,
  navItems,
  userName = "Usuário",
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 border-r border-border bg-card transform transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-4 border-b border-border">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <img
              src={logoImg}
              alt="HIVIUM"
              className="h-7 w-7 object-contain"
            />
            <span className="font-display font-bold text-xs gradient-text tracking-wide">
              HIVIUM
            </span>
          </button>
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-3 rounded-xl bg-surface p-3 mb-5">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary ring-1 ring-primary/12">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {userName}
              </div>
              <div className="text-overline text-muted-foreground mt-0.5">
                {roleLabels[role]}
              </div>
            </div>
          </div>

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                    active
                      ? "bg-primary/8 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {item.icon}
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

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-6">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-1">
            <ChatBadge />
            <NotificationBell />
          </div>
        </header>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
