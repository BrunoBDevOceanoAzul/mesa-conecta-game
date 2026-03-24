import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Plus, Trash2, Save, Loader2, Upload, Camera, ChevronDown, ChevronUp,
  Sword, Shield, Gem, ScrollText, Sparkles, Minus, CheckCircle2,
} from "lucide-react";
import { applyEpicoComputations, EPICO_COMPUTED_FIELDS } from "@/lib/epico-calculations";
import type { CharacterSheet } from "@/hooks/use-character-sheets";

interface EpicoSheetEditorProps {
  sheet: CharacterSheet;
  onUpdate: (updates: Partial<CharacterSheet>) => void;
  onAutosave: (updates: Partial<CharacterSheet>) => void;
  onUploadPortrait: (file: File) => void;
  saving?: boolean;
}

// --- Dynamic List Component ---
function DynamicList({
  title,
  icon: Icon,
  items,
  onChange,
  placeholder,
  showDots,
}: {
  title: string;
  icon: React.ElementType;
  items: { name: string; value?: number }[];
  onChange: (items: { name: string; value?: number }[]) => void;
  placeholder: string;
  showDots?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-xl border border-[hsl(var(--sheet-border,var(--border)))] bg-gradient-to-br from-card to-card/80 overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-display font-semibold">{title}</span>
          <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-md">
            {items.length}
          </span>
        </div>
        {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <Input
                value={item.name}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], name: e.target.value };
                  onChange(next);
                }}
                placeholder={placeholder}
                className="h-8 text-sm flex-1 bg-background/50"
              />
              {showDots && (
                <Input
                  type="number"
                  value={item.value ?? 0}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], value: Number(e.target.value) };
                    onChange(next);
                  }}
                  className="h-8 w-16 text-sm text-center bg-background/50"
                  min={0}
                  max={10}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="h-8 w-8 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange([...items, { name: "", value: 0 }])}
            className="text-xs gap-1 text-primary h-7"
          >
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Attribute Block ---
function AttributeBlock({
  label,
  value,
  fadigaValue,
  onValueChange,
  onFadigaChange,
}: {
  label: string;
  value: number;
  fadigaValue: number;
  onValueChange: (v: number) => void;
  onFadigaChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[hsl(var(--sheet-border,var(--border)))] bg-gradient-to-b from-primary/5 to-transparent p-4 gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">{label}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onValueChange(Math.max(0, value - 1))}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-2xl font-display font-bold text-foreground w-8 text-center">{value}</span>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onValueChange(Math.min(10, value + 1))}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] text-muted-foreground uppercase">Fadiga</span>
        <Input
          type="number"
          value={fadigaValue}
          onChange={(e) => onFadigaChange(Math.max(0, Number(e.target.value)))}
          className="h-6 w-12 text-xs text-center bg-background/50"
          min={0}
        />
      </div>
    </div>
  );
}

// --- Stat Tile ---
function StatTile({ label, value, computed, onChange }: {
  label: string;
  value: number;
  computed?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className={`flex flex-col items-center rounded-lg border p-3 gap-1 ${computed ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center leading-tight">{label}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onChange(value - 1)}>
          <Minus className="h-2.5 w-2.5" />
        </Button>
        <span className="text-lg font-bold font-display w-7 text-center">{value}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onChange(value + 1)}>
          <Plus className="h-2.5 w-2.5" />
        </Button>
      </div>
      {computed && <span className="text-[8px] text-primary/60 flex items-center gap-0.5"><Sparkles className="h-2 w-2" /> auto</span>}
    </div>
  );
}

// --- Main Editor ---
export function EpicoSheetEditor({
  sheet, onUpdate, onAutosave, onUploadPortrait, saving,
}: EpicoSheetEditorProps) {
  const [values, setValues] = useState<Record<string, any>>(sheet.answers_json || {});
  const [lists, setLists] = useState<Record<string, { name: string; value?: number }[]>>({
    virtudes: (sheet.answers_json?.virtudes as any) || [],
    defeitos: (sheet.answers_json?.defeitos as any) || [],
    aptidoes: (sheet.answers_json?.aptidoes as any) || [],
    ataques: (sheet.answers_json?.ataques as any) || [],
    armaduras: (sheet.answers_json?.armaduras as any) || [],
    dinheiro: (sheet.answers_json?.dinheiro as any) || [],
    equipamentos: (sheet.answers_json?.equipamentos as any) || [],
  });
  const [manualOverrides, setManualOverrides] = useState<Set<string>>(
    new Set((sheet.answers_json?._manualOverrides as string[]) || [])
  );
  const [lastSaved, setLastSaved] = useState<string | null>(sheet.last_saved_at);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply computations whenever primary attributes change
  useEffect(() => {
    const computed = applyEpicoComputations(values, manualOverrides);
    if (JSON.stringify(computed) !== JSON.stringify(values)) {
      setValues(computed);
    }
  }, [values.vigor, values.agilidade, values.inteligencia]);

  const updateField = (key: string, val: any) => {
    const isComputed = EPICO_COMPUTED_FIELDS.has(key);
    if (isComputed) {
      setManualOverrides(prev => new Set([...prev, key]));
    }
    setValues(prev => ({ ...prev, [key]: val }));
  };

  // Trigger autosave on any change
  useEffect(() => {
    const allData = { ...values, ...lists, _manualOverrides: Array.from(manualOverrides) };
    onAutosave({
      answers_json: allData,
      character_name: values.character_name || sheet.character_name,
      player_name: values.player_name || sheet.player_name,
    } as any);
    setLastSaved(new Date().toISOString());
  }, [values, lists]);

  const updateList = (key: string, items: { name: string; value?: number }[]) => {
    setLists(prev => ({ ...prev, [key]: items }));
  };

  return (
    <div className="space-y-6" style={{
      "--sheet-border": "270 48% 49% / 0.2",
      fontFamily: "'Playfair Display', serif",
    } as React.CSSProperties}>
      {/* Save indicator */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        {saving ? (
          <><Loader2 className="h-3 w-3 animate-spin" /> Salvando...</>
        ) : (
          <><CheckCircle2 className="h-3 w-3 text-green-500" /> Salvo automaticamente</>
        )}
      </div>

      {/* Portrait + Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Portrait */}
        <div className="flex-shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-28 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group"
          >
            {sheet.portrait_url ? (
              <img src={sheet.portrait_url} alt="Retrato" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <Camera className="h-6 w-6 text-primary/40 mx-auto mb-1 group-hover:text-primary/60 transition-colors" />
                <span className="text-[9px] text-muted-foreground">Retrato</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) onUploadPortrait(e.target.files[0]); }}
          />
        </div>

        {/* Header Fields */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-primary/60 mb-1 block">Personagem</label>
            <Input
              value={values.character_name || ""}
              onChange={(e) => updateField("character_name", e.target.value)}
              className="font-display text-lg font-bold h-10 bg-background/50"
              placeholder="Nome do personagem"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-primary/60 mb-1 block">Jogador</label>
            <Input
              value={values.player_name || ""}
              onChange={(e) => updateField("player_name", e.target.value)}
              className="h-9 text-sm bg-background/50"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-primary/60 mb-1 block">XP Total</label>
            <Input
              type="number"
              value={values.xp_total || 0}
              onChange={(e) => updateField("xp_total", Number(e.target.value))}
              className="h-9 text-sm bg-background/50"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Primary Attributes */}
      <Card className="p-4 border-primary/15 bg-gradient-to-br from-card to-primary/5">
        <h3 className="text-sm font-display font-bold uppercase tracking-[0.18em] text-primary mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Atributos Primários
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <AttributeBlock
            label="Vigor"
            value={Number(values.vigor) || 0}
            fadigaValue={Number(values.fadiga_vigor) || 0}
            onValueChange={(v) => updateField("vigor", v)}
            onFadigaChange={(v) => updateField("fadiga_vigor", v)}
          />
          <AttributeBlock
            label="Agilidade"
            value={Number(values.agilidade) || 0}
            fadigaValue={Number(values.fadiga_agilidade) || 0}
            onValueChange={(v) => updateField("agilidade", v)}
            onFadigaChange={(v) => updateField("fadiga_agilidade", v)}
          />
          <AttributeBlock
            label="Inteligência"
            value={Number(values.inteligencia) || 0}
            fadigaValue={Number(values.fadiga_inteligencia) || 0}
            onValueChange={(v) => updateField("inteligencia", v)}
            onFadigaChange={(v) => updateField("fadiga_inteligencia", v)}
          />
        </div>
      </Card>

      {/* Secondary Attributes */}
      <Card className="p-4 border-primary/15">
        <h3 className="text-sm font-display font-bold uppercase tracking-[0.18em] text-primary mb-4 flex items-center gap-2">
          <ScrollText className="h-4 w-4" /> Atributos Secundários
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {[
            { key: "dificuldade_alvo", label: "Dif. Alvo" },
            { key: "forca_vontade", label: "F. Vontade" },
            { key: "bonus_dano", label: "Bônus Dano" },
            { key: "percepcao", label: "Percepção" },
            { key: "velocidade", label: "Velocidade" },
            { key: "tamanho", label: "Tamanho" },
            { key: "pontos_vida", label: "P. Vida" },
            { key: "ferimentos", label: "Ferimentos" },
            { key: "carga_pesada", label: "C. Pesada" },
            { key: "carga_maxima", label: "C. Máxima" },
          ].map(({ key, label }) => (
            <StatTile
              key={key}
              label={label}
              value={Number(values[key]) || 0}
              computed={EPICO_COMPUTED_FIELDS.has(key) && !manualOverrides.has(key)}
              onChange={(v) => updateField(key, v)}
            />
          ))}
        </div>
      </Card>

      {/* Dynamic Lists */}
      <DynamicList title="Virtudes" icon={Sparkles} items={lists.virtudes} onChange={(i) => updateList("virtudes", i)} placeholder="Nome da virtude" showDots />
      <DynamicList title="Defeitos" icon={Shield} items={lists.defeitos} onChange={(i) => updateList("defeitos", i)} placeholder="Nome do defeito" showDots />
      <DynamicList title="Aptidões & Especialidades" icon={Gem} items={lists.aptidoes} onChange={(i) => updateList("aptidoes", i)} placeholder="Aptidão ou especialidade" showDots />
      <DynamicList title="Ataques" icon={Sword} items={lists.ataques} onChange={(i) => updateList("ataques", i)} placeholder="Nome do ataque" showDots />
      <DynamicList title="Armaduras" icon={Shield} items={lists.armaduras} onChange={(i) => updateList("armaduras", i)} placeholder="Nome da armadura" showDots />
      <DynamicList title="Dinheiro & Tesouros" icon={Gem} items={lists.dinheiro} onChange={(i) => updateList("dinheiro", i)} placeholder="Item ou valor" />
      <DynamicList title="Itens & Equipamentos" icon={ScrollText} items={lists.equipamentos} onChange={(i) => updateList("equipamentos", i)} placeholder="Nome do item" />

      {/* Notes */}
      <Card className="p-4 border-primary/15">
        <h3 className="text-sm font-display font-bold uppercase tracking-[0.18em] text-primary mb-3 flex items-center gap-2">
          <ScrollText className="h-4 w-4" /> Anotações
        </h3>
        <Textarea
          value={values.anotacoes || ""}
          onChange={(e) => updateField("anotacoes", e.target.value)}
          placeholder="Anotações, história do personagem, notas de sessão..."
          className="min-h-[120px] bg-background/50 text-sm"
        />
      </Card>
    </div>
  );
}
