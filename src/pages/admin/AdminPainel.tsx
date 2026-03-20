import { useState } from "react";
import { Shield, Trophy, Gift, CheckCircle2, Lightbulb, ShoppingCart, Ticket, Gamepad2, LifeBuoy, Ban, Users, ImageIcon, FileText } from "lucide-react";
import { InsightsDashboard } from "@/components/admin/InsightsDashboard";
import { GamificationConfig } from "@/components/admin/GamificationConfig";
import { CouponManager } from "@/components/admin/CouponManager";
import { GoLiveChecklist } from "@/components/admin/GoLiveChecklist";
import { CartAbandonmentDashboard } from "@/components/admin/CartAbandonmentDashboard";
import { BookingManagement } from "@/components/admin/BookingManagement";
import { MesaManagement } from "@/components/admin/MesaManagement";
import { TicketManagement } from "@/components/admin/TicketManagement";
import { BlocklistManager } from "@/components/admin/BlocklistManager";
import { AmbassadorManager } from "@/components/admin/AmbassadorManager";
import { SiteImageManager } from "@/components/admin/SiteImageManager";
import { SiteContentManager } from "@/components/admin/SiteContentManager";
import AdminLayout from "./AdminLayout";

type SubTab = "insights" | "bookings" | "mesas" | "gamification" | "coupons" | "golive" | "cart" | "tickets" | "blocklist" | "ambassadors" | "images" | "content";

export default function AdminPainel() {
  const [subTab, setSubTab] = useState<SubTab>("insights");

  const tabs: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: "insights", label: "Inteligência", icon: <Lightbulb className="h-4 w-4" /> },
    { key: "bookings", label: "Reservas", icon: <Ticket className="h-4 w-4" /> },
    { key: "mesas", label: "Mesas", icon: <Gamepad2 className="h-4 w-4" /> },
    { key: "cart", label: "Carrinho", icon: <ShoppingCart className="h-4 w-4" /> },
    { key: "gamification", label: "Gamificação", icon: <Trophy className="h-4 w-4" /> },
    { key: "coupons", label: "Cupons", icon: <Gift className="h-4 w-4" /> },
    { key: "golive", label: "Go-Live", icon: <CheckCircle2 className="h-4 w-4" /> },
    { key: "tickets", label: "Suporte", icon: <LifeBuoy className="h-4 w-4" /> },
    { key: "blocklist", label: "Blocklist", icon: <Ban className="h-4 w-4" /> },
    { key: "ambassadors", label: "Embaixadores", icon: <Users className="h-4 w-4" /> },
    { key: "images", label: "Imagens", icon: <ImageIcon className="h-4 w-4" /> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Centro de Operações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Inteligência de negócio e gestão centralizada da plataforma HIVIUM.
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 rounded-xl bg-muted/40 p-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                subTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {subTab === "insights" && <InsightsDashboard />}
        {subTab === "bookings" && <BookingManagement />}
        {subTab === "mesas" && <MesaManagement />}
        {subTab === "cart" && <CartAbandonmentDashboard />}
        {subTab === "gamification" && <GamificationConfig />}
        {subTab === "coupons" && <CouponManager />}
        {subTab === "golive" && <GoLiveChecklist />}
        {subTab === "tickets" && <TicketManagement />}
        {subTab === "blocklist" && <BlocklistManager />}
        {subTab === "ambassadors" && <AmbassadorManager />}
        {subTab === "images" && <SiteImageManager />}
      </div>
    </AdminLayout>
  );
}
