import { useState } from "react";
import { Shield, Trophy, Gift, CheckCircle2, Lightbulb, ShoppingCart, Ticket, Gamepad2, LifeBuoy, Ban, Users, ImageIcon, FileText, Store } from "lucide-react";
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
import { StoreManager } from "@/components/admin/StoreManager";
import AdminLayout from "./AdminLayout";

type SubTab = "insights" | "bookings" | "mesas" | "stores" | "gamification" | "coupons" | "golive" | "cart" | "tickets" | "blocklist" | "ambassadors" | "images" | "content";

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
    { key: "content", label: "Conteúdo", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" /> Centro de Operações
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">
            Inteligência de negócio e gestão centralizada da plataforma HIVIUM.
          </p>
        </div>

        {/* Sub-tabs — mobile: horizontal scroll with snap, touch-friendly */}
        <div className="relative">
          {/* Fade indicators for scroll */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 md:hidden" />
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10 md:hidden" />
          
          <div className="flex gap-1 rounded-xl bg-muted/40 p-1 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-3 px-3 md:mx-0 md:px-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setSubTab(t.key)}
                className={`flex items-center gap-1.5 md:gap-2 rounded-lg px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium transition-all whitespace-nowrap snap-center min-h-[44px] ${
                  subTab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.length > 8 ? t.label.slice(0, 6) + "…" : t.label}</span>
              </button>
            ))}
          </div>
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
        {subTab === "content" && <SiteContentManager />}
      </div>
    </AdminLayout>
  );
}
