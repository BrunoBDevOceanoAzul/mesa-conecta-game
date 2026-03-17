import { useMasterProgression } from "@/hooks/use-master-progression";
import { RARITY_CONFIG, CATEGORY_LABELS } from "@/lib/xp-config";
import { useXpConfig } from "@/hooks/use-xp-config";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Star, Shield, Zap, Users, Calendar, MessageSquare,
  Trophy, Sparkles, ChevronRight, Gift, Layers, MapPin
} from "lucide-react";

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

export function ProgressionPanel() {
  const prog = useMasterProgression();

  if (prog.loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const nextTier = XP_TIERS.find((t) => t.level === prog.tier.level + 1);

  return (
    <div className="space-y-6">
      {/* XP Overview Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20">
                <Trophy className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-overline text-primary">Nível {prog.level}</p>
                <h3 className="text-xl font-display font-bold text-foreground">{prog.title}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-display font-bold text-foreground">{prog.totalXp}</p>
              <p className="text-xs text-muted-foreground">XP total</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{prog.tier.title}</span>
              {nextTier && <span className="text-muted-foreground">{nextTier.title}</span>}
            </div>
            <Progress value={prog.progress.percent} className="h-3" />
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{prog.progress.current} / {prog.progress.needed} XP</span>
              <span className="text-muted-foreground">{prog.progress.percent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tier Roadmap */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-secondary" /> Hierarquia de Mestres
        </h3>
        <div className="space-y-2">
          {XP_TIERS.map((t) => {
            const isActive = t.level === prog.tier.level;
            const isCompleted = t.level < prog.tier.level;
            return (
              <div
                key={t.level}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                  isActive
                    ? "bg-primary/10 border border-primary/20"
                    : isCompleted
                      ? "opacity-60"
                      : "opacity-40"
                }`}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted/50 text-muted-foreground/50"
                }`}>
                  {t.level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {t.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{t.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {t.maxXp === Infinity ? `${t.minXp}+` : `${t.minXp}–${t.maxXp}`} XP
                </span>
                {isActive && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Founder Badges */}
      {prog.founderBadges.length > 0 && (
        <div className="rounded-xl border border-secondary/20 bg-card p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
            <Gift className="h-4 w-4 text-secondary" /> Badges Founder
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {prog.founderBadges.map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        </div>
      )}

      {/* All Badges */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Badges Conquistados
        </h3>
        {prog.badges.filter((b) => !b.is_founder_badge).length === 0 ? (
          <div className="text-center py-6">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum badge conquistado ainda.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Continue jogando para desbloquear conquistas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {prog.badges.filter((b) => !b.is_founder_badge).map((b) => (
              <BadgeCard key={b.id} badge={b} />
            ))}
          </div>
        )}
      </div>

      {/* Recent XP Events */}
      {prog.recentEvents.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-secondary" /> Histórico de XP
          </h3>
          <div className="space-y-2">
            {prog.recentEvents.slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs text-foreground">{e.action_type.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-secondary">+{e.xp_amount} XP</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge }: { badge: import("@/hooks/use-master-progression").AwardedBadge }) {
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
