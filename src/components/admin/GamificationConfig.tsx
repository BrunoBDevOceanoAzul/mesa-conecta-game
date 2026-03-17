import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Save, RotateCcw, Plus, Trash2, Zap, Trophy, Layers
} from "lucide-react";
import { XP_TIERS as DEFAULT_TIERS, XP_ACTIONS as DEFAULT_ACTIONS, type XpTier, type XpAction } from "@/lib/xp-config";

interface EditableTier {
  level: number;
  title: string;
  minXp: number;
  maxXp: number | "Infinity";
  description: string;
}

interface EditableAction {
  type: string;
  label: string;
  xp: number;
  description: string;
}

export function GamificationConfig() {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<EditableTier[]>([]);
  const [actions, setActions] = useState<EditableAction[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    const [tiersRes, actionsRes] = await Promise.all([
      supabase.from("admin_settings").select("value").eq("key", "xp_tiers").maybeSingle(),
      supabase.from("admin_settings").select("value").eq("key", "xp_actions").maybeSingle(),
    ]);

    const tierData = tiersRes.data?.value as EditableTier[] | null;
    const actionData = actionsRes.data?.value as EditableAction[] | null;

    setTiers(
      tierData && Array.isArray(tierData)
        ? tierData
        : DEFAULT_TIERS.map((t) => ({ ...t, maxXp: t.maxXp === Infinity ? "Infinity" as const : t.maxXp }))
    );
    setActions(
      actionData && Array.isArray(actionData)
        ? actionData
        : DEFAULT_ACTIONS.map((a) => ({ type: a.type, label: a.label, xp: a.xp, description: a.description }))
    );
    setHasChanges(false);
  }

  function updateTier(idx: number, field: keyof EditableTier, value: string | number) {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
    setHasChanges(true);
  }

  function addTier() {
    const lastTier = tiers[tiers.length - 1];
    const newMinXp = lastTier ? (lastTier.maxXp === "Infinity" ? (lastTier.minXp + 500) : Number(lastTier.maxXp) + 1) : 0;
    // Update last tier's maxXp
    setTiers((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], maxXp: newMinXp - 1 };
      }
      return [
        ...updated,
        { level: tiers.length + 1, title: "Novo Tier", minXp: newMinXp, maxXp: "Infinity" as const, description: "Descrição do novo tier" },
      ];
    });
    setHasChanges(true);
  }

  function removeTier(idx: number) {
    if (tiers.length <= 2) return;
    setTiers((prev) => {
      const updated = prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, level: i + 1 }));
      // Last tier always has Infinity
      if (updated.length > 0) updated[updated.length - 1].maxXp = "Infinity";
      return updated;
    });
    setHasChanges(true);
  }

  function updateAction(idx: number, field: keyof EditableAction, value: string | number) {
    setActions((prev) => prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
    setHasChanges(true);
  }

  function addAction() {
    setActions((prev) => [...prev, { type: "new_action", label: "Nova ação", xp: 10, description: "Descrição da ação" }]);
    setHasChanges(true);
  }

  function removeAction(idx: number) {
    setActions((prev) => prev.filter((_, i) => i !== idx));
    setHasChanges(true);
  }

  async function saveConfig() {
    setSaving(true);
    // Recalculate levels
    const finalTiers = tiers.map((t, i) => ({ ...t, level: i + 1 }));

    const [tiersRes, actionsRes] = await Promise.all([
      supabase.from("admin_settings").upsert({ key: "xp_tiers", value: finalTiers as any }),
      supabase.from("admin_settings").upsert({ key: "xp_actions", value: actions as any }),
    ]);

    if (tiersRes.error || actionsRes.error) {
      toast({ title: "Erro ao salvar", description: tiersRes.error?.message || actionsRes.error?.message, variant: "destructive" });
    } else {
      toast({ title: "Configuração salva!", description: "Tiers e ações de XP atualizados com sucesso." });
      setHasChanges(false);
    }
    setSaving(false);
  }

  function resetToDefaults() {
    setTiers(DEFAULT_TIERS.map((t) => ({ ...t, maxXp: t.maxXp === Infinity ? "Infinity" as const : t.maxXp })));
    setActions(DEFAULT_ACTIONS.map((a) => ({ type: a.type, label: a.label, xp: a.xp, description: a.description })));
    setHasChanges(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Configuração de Gamificação
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Edite tiers, XP por ação e regras de progressão dos mestres.</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-[10px] text-secondary border-secondary/30 animate-pulse">
              Alterações não salvas
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={resetToDefaults}>
            <RotateCcw className="h-3 w-3" /> Restaurar padrão
          </Button>
          <Button variant="hero" size="sm" className="gap-1" onClick={saveConfig} disabled={saving || !hasChanges}>
            <Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Tiers Editor */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-secondary" /> Hierarquia de Tiers
          </h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={addTier}>
            <Plus className="h-3 w-3" /> Adicionar tier
          </Button>
        </div>
        <div className="space-y-3">
          {tiers.map((tier, idx) => (
            <div key={idx} className="grid grid-cols-[40px_1fr_100px_100px_1fr_32px] gap-2 items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                {idx + 1}
              </div>
              <input
                value={tier.title}
                onChange={(e) => updateTier(idx, "title", e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Título do tier"
              />
              <input
                type="number"
                value={tier.minXp}
                onChange={(e) => updateTier(idx, "minXp", Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-center"
                placeholder="XP mín"
              />
              <input
                type="number"
                value={tier.maxXp === "Infinity" ? "" : tier.maxXp}
                onChange={(e) => updateTier(idx, "maxXp", e.target.value === "" ? "Infinity" : Number(e.target.value))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-center"
                placeholder="∞"
                disabled={idx === tiers.length - 1}
              />
              <input
                value={tier.description}
                onChange={(e) => updateTier(idx, "description", e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Descrição"
              />
              <button
                onClick={() => removeTier(idx)}
                disabled={tiers.length <= 2}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> Nível</span>
          <span>Título</span>
          <span>XP Mín</span>
          <span>XP Máx</span>
          <span>Descrição</span>
        </div>
      </div>

      {/* XP Actions Editor */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-secondary" /> Ações de XP
          </h3>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={addAction}>
            <Plus className="h-3 w-3" /> Adicionar ação
          </Button>
        </div>
        <div className="space-y-2">
          {actions.map((action, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_80px_1fr_32px] gap-2 items-center">
              <input
                value={action.type}
                onChange={(e) => updateAction(idx, "type", e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="action_type"
              />
              <input
                value={action.label}
                onChange={(e) => updateAction(idx, "label", e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Label"
              />
              <div className="relative">
                <input
                  type="number"
                  value={action.xp}
                  onChange={(e) => updateAction(idx, "xp", Number(e.target.value))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-center w-full pr-8"
                  placeholder="XP"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-secondary">XP</span>
              </div>
              <input
                value={action.description}
                onChange={(e) => updateAction(idx, "description", e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Descrição"
              />
              <button
                onClick={() => removeAction(idx)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3 text-[10px] text-muted-foreground">
          <span>Código</span>
          <span>Label</span>
          <span>XP</span>
          <span>Descrição</span>
        </div>
      </div>
    </div>
  );
}
