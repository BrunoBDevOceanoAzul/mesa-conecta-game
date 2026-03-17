import { RARITY_CONFIG, CATEGORY_LABELS } from "@/lib/xp-config";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Star, Shield, Zap, Users, Calendar, MessageSquare,
  Layers, MapPin
} from "lucide-react";
import type { AwardedBadge } from "@/hooks/use-master-progression";

const ICON_MAP: Record<string, React.ReactNode> = {
  crown: <Crown className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  building: <Layers className="h-4 w-4" />,
  map: <MapPin className="h-4 w-4" />,
  "plus-circle": <Zap className="h-4 w-4" />,
  layers: <Layers className="h-4 w-4" />,
  "user-check": <Users className="h-4 w-4" />,
  "calendar-check": <Calendar className="h-4 w-4" />,
  shield: <Shield className="h-4 w-4" />,
  zap: <Zap className="h-4 w-4" />,
  "message-square": <MessageSquare className="h-4 w-4" />,
};

export function BadgeCard({ badge }: { badge: AwardedBadge }) {
  const def = badge.definition;
  if (!def) return null;
  const rarity = RARITY_CONFIG[def.rarity] || RARITY_CONFIG.common;
  const icon = def.icon_key ? ICON_MAP[def.icon_key] : <Star className="h-4 w-4" />;

  return (
    <div className={`rounded-xl border p-3.5 bg-gradient-to-br ${rarity.gradient} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${rarity.className} bg-background/50 shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-display font-semibold text-foreground truncate">{def.name}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{def.description}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${rarity.className}`}>
              {rarity.label}
            </Badge>
            <span className="text-[9px] text-muted-foreground">{CATEGORY_LABELS[def.category] || def.category}</span>
          </div>
        </div>
      </div>
      {def.flavor_text && (
        <p className="text-[10px] italic text-muted-foreground/70 mt-2 pl-11">"{def.flavor_text}"</p>
      )}
    </div>
  );
}
