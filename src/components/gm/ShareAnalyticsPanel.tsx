import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, MousePointerClick, Eye, TrendingUp, Users,
  MessageCircle, Send, Facebook, Twitter, Link2
} from "lucide-react";

interface ChannelStat {
  channel: string;
  links: number;
  clicks: number;
  bookings: number;
  revenue: number;
}

const channelIcons: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  telegram: Send,
  facebook: Facebook,
  twitter: Twitter,
  discord: MessageCircle,
  link_copy: Link2,
};

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  facebook: "Facebook",
  twitter: "X / Twitter",
  discord: "Discord",
  link_copy: "Link Copiado",
};

export function ShareAnalyticsPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ChannelStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ links: 0, clicks: 0, bookings: 0, revenue: 0 });

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      // Get share links
      const { data: links } = await (supabase as any)
        .from("share_links")
        .select("id, channel")
        .eq("owner_user_id", user.id) as { data: any[] | null };

      if (!links || links.length === 0) {
        setLoading(false);
        return;
      }

      const linkIds = links.map((l: any) => l.id);

      // Get clicks
      const { data: clicks } = await (supabase as any)
        .from("share_link_clicks")
        .select("share_link_id")
        .in("share_link_id", linkIds) as { data: any[] | null };

      // Get attribution events
      const { data: events } = await (supabase as any)
        .from("attribution_events")
        .select("share_link_id, event_type, revenue_amount")
        .in("share_link_id", linkIds) as { data: any[] | null };

      // Aggregate by channel
      const channelMap: Record<string, ChannelStat> = {};

      for (const link of links) {
        if (!channelMap[link.channel]) {
          channelMap[link.channel] = { channel: link.channel, links: 0, clicks: 0, bookings: 0, revenue: 0 };
        }
        channelMap[link.channel].links += 1;
      }

      for (const click of clicks || []) {
        const link = links.find((l) => l.id === click.share_link_id);
        if (link && channelMap[link.channel]) {
          channelMap[link.channel].clicks += 1;
        }
      }

      for (const event of events || []) {
        const link = links.find((l) => l.id === event.share_link_id);
        if (link && channelMap[link.channel]) {
          if (event.event_type === "booking") channelMap[link.channel].bookings += 1;
          channelMap[link.channel].revenue += Number(event.revenue_amount || 0);
        }
      }

      const statsList = Object.values(channelMap).sort((a, b) => b.clicks - a.clicks);
      setStats(statsList);
      setTotals({
        links: statsList.reduce((s, c) => s + c.links, 0),
        clicks: statsList.reduce((s, c) => s + c.clicks, 0),
        bookings: statsList.reduce((s, c) => s + c.bookings, 0),
        revenue: statsList.reduce((s, c) => s + c.revenue, 0),
      });
      setLoading(false);
    };

    loadStats();
  }, [user]);

  if (loading) {
    return <div className="h-48 rounded-xl bg-muted/50 animate-pulse" />;
  }

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum link compartilhado ainda.</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Compartilhe suas mesas para ver métricas por canal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-primary" />
        Atribuição por Canal
      </h3>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <TotalCard icon={<Link2 className="h-4 w-4" />} label="Links Gerados" value={totals.links} />
        <TotalCard icon={<MousePointerClick className="h-4 w-4" />} label="Cliques" value={totals.clicks} />
        <TotalCard icon={<Users className="h-4 w-4" />} label="Reservas" value={totals.bookings} />
        <TotalCard icon={<TrendingUp className="h-4 w-4" />} label="Receita" value={`R$${totals.revenue.toFixed(0)}`} />
      </div>

      {/* Channel breakdown */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Canal</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Links</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Cliques</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Reservas</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Receita</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Conv.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stats.map((ch) => {
              const Icon = channelIcons[ch.channel] || Link2;
              const convRate = ch.clicks > 0 ? ((ch.bookings / ch.clicks) * 100).toFixed(1) : "0.0";
              return (
                <tr key={ch.channel} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {channelLabels[ch.channel] || ch.channel}
                  </td>
                  <td className="text-right px-4 py-3 text-muted-foreground">{ch.links}</td>
                  <td className="text-right px-4 py-3 text-foreground font-medium">{ch.clicks}</td>
                  <td className="text-right px-4 py-3 text-muted-foreground hidden sm:table-cell">{ch.bookings}</td>
                  <td className="text-right px-4 py-3 text-foreground hidden sm:table-cell">R${ch.revenue.toFixed(0)}</td>
                  <td className="text-right px-4 py-3 hidden md:table-cell">
                    <Badge variant={Number(convRate) > 5 ? "success" : "secondary"} className="text-[10px]">
                      {convRate}%
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TotalCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className="flex h-8 w-8 mx-auto items-center justify-center rounded-lg bg-primary/10 text-primary mb-2">
        {icon}
      </div>
      <p className="text-lg font-display font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
