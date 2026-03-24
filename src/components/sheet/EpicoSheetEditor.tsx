import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Trash2, Loader2, Camera, ChevronDown, ChevronUp,
  Sword, Shield, Gem, ScrollText, Sparkles, Minus, CheckCircle2,
  Heart, Zap, Brain, Wind, Eye, Target, Flame, Weight, Package,
  BookOpen, Feather,
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

/* ─── Section wrapper with ornamental header ─── */
function SheetSection({
  title,
  icon: Icon,
  children,
  accent = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border overflow-hidden ${accent
      ? "border-primary/20 bg-gradient-to-br from-primary/[0.04] via-card to-card shadow-[0_2px_20px_hsl(var(--primary)/0.06)]"
      : "border-border/60 bg-card shadow-sm"
    }`}>
      {/* Ornamental top line */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-[13px] font-display font-bold uppercase tracking-[0.2em] text-foreground/80">
            {title}
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Primary Attribute — large, tactile, shield-like ─── */
function AttributeBlock({
  label,
  icon: Icon,
  value,
  fadigaValue,
  onValueChange,
  onFadigaChange,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  fadigaValue: number;
  onValueChange: (v: number) => void;
  onFadigaChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      {/* Shield-style container */}
      <div className="relative w-full max-w-[140px] rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.08] via-card to-card p-4 flex flex-col items-center gap-1.5 shadow-sm">
        <Icon className="h-4 w-4 text-primary/50" />
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/60">{label}</span>
        
        {/* Central value */}
        <div className="relative my-1">
          <div className="h-14 w-14 rounded-full border-2 border-primary/25 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center shadow-[inset_0_1px_3px_hsl(var(--primary)/0.1)]">
            <span className="text-2xl font-display font-black text-foreground tabular-nums">{value}</span>
          </div>
        </div>

        {/* +/- controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onValueChange(Math.max(0, value - 1))}
            className="h-7 w-7 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center hover:bg-muted/60 transition-colors active:scale-95"
          >
            <Minus className="h-3 w-3 text-muted-foreground" />
          </button>
          <button
            onClick={() => onValueChange(Math.min(10, value + 1))}
            className="h-7 w-7 rounded-full border border-border/60 bg-muted/30 flex items-center justify-center hover:bg-muted/60 transition-colors active:scale-95"
          >
            <Plus className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>

        {/* Fadiga inline */}
        <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-border/40 w-full justify-center">
          <Flame className="h-2.5 w-2.5 text-destructive/40" />
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold">Fadiga</span>
          <Input
            type="number"
            value={fadigaValue}
            onChange={(e) => onFadigaChange(Math.max(0, Number(e.target.value)))}
            className="h-5 w-10 text-[11px] text-center bg-background/60 border-border/40 px-1 rounded"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Secondary stat tile — compact with auto badge ─── */
function StatTile({ label, icon: Icon, value, computed, onChange }: {
  label: string;
  icon: React.ElementType;
  value: number;
  computed?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className={`relative flex flex-col items-center rounded-xl border p-3 gap-1 transition-colors ${
      computed
        ? "border-primary/15 bg-primary/[0.03]"
        : "border-border/50 bg-card"
    }`}>
      {computed && (
        <div className="absolute -top-1.5 right-1.5 flex items-center gap-0.5 bg-primary/10 text-primary text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
          <Sparkles className="h-2 w-2" /> auto
        </div>
      )}
      <Icon className="h-3 w-3 text-muted-foreground/50" />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-center leading-tight">{label}</span>
      <div className="flex items-center gap-1 mt-0.5">
        <button
          onClick={() => onChange(value - 1)}
          className="h-5 w-5 rounded border border-border/40 flex items-center justify-center hover:bg-muted/40 transition-colors active:scale-95"
        >
          <Minus className="h-2 w-2" />
        </button>
        <span className="text-lg font-black font-display w-8 text-center tabular-nums">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="h-5 w-5 rounded border border-border/40 flex items-center justify-center hover:bg-muted/40 transition-colors active:scale-95"
        >
          <Plus className="h-2 w-2" />
        </button>
      </div>
    </div>
  );
}

/* ─── Dynamic list with dot ratings ─── */
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
  const [collapsed, setCollapsed] = useState(items.length === 0);

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <div className="h-[2px] bg-gradient-to-r from-transparent via-border/60 to-transparent" />
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/10 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Icon className="h-3 w-3 text-primary" />
          </div>
          <span className="text-[13px] font-display font-bold uppercase tracking-[0.15em] text-foreground/80">{title}</span>
          {items.length > 0 && (
            <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full font-medium">
              {items.length}
            </span>
          )}
        </div>
        {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground/50" /> : <ChevronUp className="h-4 w-4 text-muted-foreground/50" />}
      </button>

      {!collapsed && (
        <div className="px-5 pb-4 space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 group rounded-lg hover:bg-muted/10 px-2 py-1 -mx-2 transition-colors">
              <span className="text-[10px] text-muted-foreground/40 w-4 text-right font-mono">{i + 1}</span>
              <Input
                value={item.name}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], name: e.target.value };
                  onChange(next);
                }}
                placeholder={placeholder}
                className="h-8 text-sm flex-1 bg-transparent border-border/30 focus:border-primary/30"
              />
              {showDots && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, dot) => (
                    <button
                      key={dot}
                      onClick={() => {
                        const next = [...items];
                        const newVal = dot + 1 === item.value ? dot : dot + 1;
                        next[i] = { ...next[i], value: newVal };
                        onChange(next);
                      }}
                      className={`h-4 w-4 rounded-full border-2 transition-all ${
                        (item.value ?? 0) > dot
                          ? "bg-primary border-primary shadow-[0_0_4px_hsl(var(--primary)/0.3)]"
                          : "bg-transparent border-border/40 hover:border-primary/40"
                      }`}
                    />
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="h-7 w-7 p-0 text-destructive/60 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <button
            onClick={() => onChange([...items, { name: "", value: 0 }])}
            className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors h-8 px-2"
          >
            <Plus className="h-3 w-3" /> Adicionar
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ MAIN EDITOR ═══════════════ */
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const computed = applyEpicoComputations(values, manualOverrides);
    if (JSON.stringify(computed) !== JSON.stringify(values)) {
      setValues(computed);
    }
  }, [values.vigor, values.agilidade, values.inteligencia]);

  const updateField = (key: string, val: any) => {
    if (EPICO_COMPUTED_FIELDS.has(key)) {
      setManualOverrides(prev => new Set([...prev, key]));
    }
    setValues(prev => ({ ...prev, [key]: val }));
  };

  useEffect(() => {
    const allData = { ...values, ...lists, _manualOverrides: Array.from(manualOverrides) };
    onAutosave({
      answers_json: allData,
      character_name: values.character_name || sheet.character_name,
      player_name: values.player_name || sheet.player_name,
    } as any);
  }, [values, lists]);

  const updateList = (key: string, items: { name: string; value?: number }[]) => {
    setLists(prev => ({ ...prev, [key]: items }));
  };

  const SECONDARY_STATS = [
    { key: "dificuldade_alvo", label: "Dificuldade-Alvo", icon: Target },
    { key: "forca_vontade", label: "Força de Vontade", icon: Brain },
    { key: "bonus_dano", label: "Bônus de Dano", icon: Sword },
    { key: "percepcao", label: "Percepção", icon: Eye },
    { key: "velocidade", label: "Velocidade", icon: Wind },
    { key: "tamanho", label: "Tamanho", icon: Feather },
    { key: "pontos_vida", label: "Pontos de Vida", icon: Heart },
    { key: "ferimentos", label: "Ferimentos", icon: Flame },
    { key: "carga_pesada", label: "Carga Pesada", icon: Weight },
    { key: "carga_maxima", label: "Carga Máxima", icon: Package },
  ];

  return (
    <div className="space-y-5" style={{ fontFamily: "'Playfair Display', serif" }}>
      {/* ─── Save Status Bar ─── */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
          Épico RPG · Ficha Digital
        </span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {saving ? (
            <><Loader2 className="h-3 w-3 animate-spin text-primary" /> <span className="text-primary">Salvando...</span></>
          ) : (
            <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Salvo</>
          )}
        </div>
      </div>

      {/* ─── Portrait + Header ─── */}
      <div className="relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="h-[3px] bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
        <div className="p-5">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Portrait */}
            <div className="flex-shrink-0 self-center sm:self-start">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-2xl border-2 border-dashed border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent flex items-center justify-center cursor-pointer hover:border-primary/40 transition-all overflow-hidden group shadow-inner"
              >
                {sheet.portrait_url ? (
                  <img src={sheet.portrait_url} alt="Retrato" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center space-y-1.5">
                    <Camera className="h-7 w-7 text-primary/30 mx-auto group-hover:text-primary/50 transition-colors" />
                    <span className="text-[10px] text-muted-foreground/60 block">Retrato</span>
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

            {/* Header fields */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/50 mb-1.5 block">Nome do Personagem</label>
                <Input
                  value={values.character_name || ""}
                  onChange={(e) => updateField("character_name", e.target.value)}
                  className="font-display text-xl font-black h-12 bg-transparent border-border/30 focus:border-primary/40 tracking-wide"
                  placeholder="Seu herói épico..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/50 mb-1.5 block">Jogador</label>
                  <Input
                    value={values.player_name || ""}
                    onChange={(e) => updateField("player_name", e.target.value)}
                    className="h-9 text-sm bg-transparent border-border/30"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/50 mb-1.5 block">XP Total</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={values.xp_total || 0}
                      onChange={(e) => updateField("xp_total", Number(e.target.value))}
                      className="h-9 text-sm bg-transparent border-border/30 font-bold tabular-nums"
                      min={0}
                    />
                    <Zap className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Primary Attributes ─── */}
      <SheetSection title="Atributos Primários" icon={Sparkles} accent>
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          <AttributeBlock
            label="Vigor" icon={Heart}
            value={Number(values.vigor) || 0}
            fadigaValue={Number(values.fadiga_vigor) || 0}
            onValueChange={(v) => updateField("vigor", v)}
            onFadigaChange={(v) => updateField("fadiga_vigor", v)}
          />
          <AttributeBlock
            label="Agilidade" icon={Wind}
            value={Number(values.agilidade) || 0}
            fadigaValue={Number(values.fadiga_agilidade) || 0}
            onValueChange={(v) => updateField("agilidade", v)}
            onFadigaChange={(v) => updateField("fadiga_agilidade", v)}
          />
          <AttributeBlock
            label="Inteligência" icon={Brain}
            value={Number(values.inteligencia) || 0}
            fadigaValue={Number(values.fadiga_inteligencia) || 0}
            onValueChange={(v) => updateField("inteligencia", v)}
            onFadigaChange={(v) => updateField("fadiga_inteligencia", v)}
          />
        </div>
      </SheetSection>

      {/* ─── Secondary Attributes ─── */}
      <SheetSection title="Atributos Secundários" icon={ScrollText}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {SECONDARY_STATS.map(({ key, label, icon }) => (
            <StatTile
              key={key}
              label={label}
              icon={icon}
              value={Number(values[key]) || 0}
              computed={EPICO_COMPUTED_FIELDS.has(key) && !manualOverrides.has(key)}
              onChange={(v) => updateField(key, v)}
            />
          ))}
        </div>
      </SheetSection>

      {/* ─── Lists ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DynamicList title="Virtudes" icon={Sparkles} items={lists.virtudes} onChange={(i) => updateList("virtudes", i)} placeholder="Nome da virtude" showDots />
        <DynamicList title="Defeitos" icon={Shield} items={lists.defeitos} onChange={(i) => updateList("defeitos", i)} placeholder="Nome do defeito" showDots />
      </div>
      <DynamicList title="Aptidões & Especialidades" icon={BookOpen} items={lists.aptidoes} onChange={(i) => updateList("aptidoes", i)} placeholder="Aptidão ou especialidade" showDots />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DynamicList title="Ataques" icon={Sword} items={lists.ataques} onChange={(i) => updateList("ataques", i)} placeholder="Nome do ataque" showDots />
        <DynamicList title="Armaduras" icon={Shield} items={lists.armaduras} onChange={(i) => updateList("armaduras", i)} placeholder="Nome da armadura" showDots />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DynamicList title="Dinheiro & Tesouros" icon={Gem} items={lists.dinheiro} onChange={(i) => updateList("dinheiro", i)} placeholder="Item ou valor" />
        <DynamicList title="Itens & Equipamentos" icon={Package} items={lists.equipamentos} onChange={(i) => updateList("equipamentos", i)} placeholder="Nome do item" />
      </div>

      {/* ─── Notes ─── */}
      <SheetSection title="Anotações" icon={Feather}>
        <Textarea
          value={values.anotacoes || ""}
          onChange={(e) => updateField("anotacoes", e.target.value)}
          placeholder="Anotações, história do personagem, notas de sessão..."
          className="min-h-[140px] bg-transparent border-border/30 text-sm resize-y focus:border-primary/30"
        />
      </SheetSection>

      {/* Bottom spacer for mobile */}
      <div className="h-8" />
    </div>
  );
}
