/**
 * PremiumCharacterSheet — The flagship themed sheet renderer.
 *
 * Renders a system-specific character sheet with themed visuals,
 * dot ratings, attribute grids, and a tabletop sheet feeling.
 * Falls back to a premium generic layout when no template exists.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getSheetTheme, type SheetTheme } from "@/lib/sheet-themes";
import { getSheetTemplate } from "@/data/sheet-templates";
import type { SheetSectionDef, SheetFieldDef, SheetTemplate } from "@/data/sheet-templates/sheet-template-types";
import { SheetDotRating } from "./SheetDotRating";
import { SheetAttributeGrid } from "./SheetAttributeGrid";
import { SheetSectionBlock } from "./SheetSectionBlock";
import { SheetTextField } from "./SheetTextField";
import { SheetNumberField } from "./SheetNumberField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ScrollText, Save, Send, Loader2, CheckCircle2, Clock,
  AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

interface PremiumCharacterSheetProps {
  systemName?: string;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  saving?: boolean;
  submitting?: boolean;
  status?: string;
  disabled?: boolean;
  deadlineAt?: string | null;
  gmInstructions?: string | null;
}

export function PremiumCharacterSheet({
  systemName,
  values,
  onChange,
  onSaveDraft,
  onSubmit,
  saving,
  submitting,
  status = "not_started",
  disabled: propDisabled,
  deadlineAt,
  gmInstructions,
}: PremiumCharacterSheetProps) {
  const theme = getSheetTheme(systemName);
  const template = getSheetTemplate(systemName);
  const [activeSection, setActiveSection] = useState(0);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const sections = template?.sections || [];
  const isSubmitted = status === "submitted";
  const isReviewed = status === "reviewed";
  const disabled = propDisabled || isSubmitted || isReviewed;
  const isPastDeadline = deadlineAt ? new Date(deadlineAt) < new Date() : false;

  // Calculate progress
  const allRequiredFields = sections.flatMap((s) =>
    (s.fields || []).filter((f) => f.required).map((f) => f.id)
  );
  const filledCount = allRequiredFields.filter((id) => {
    const v = values[id];
    return v !== undefined && v !== null && v !== "" && v !== 0;
  }).length;
  const progress = allRequiredFields.length > 0
    ? Math.round((filledCount / allRequiredFields.length) * 100)
    : 100;

  // Auto-save debounce
  const setField = useCallback((id: string, value: any) => {
    const next = { ...values, [id]: value };
    onChange(next);

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      onSaveDraft?.();
    }, 3000);
  }, [values, onChange, onSaveDraft]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  if (!template) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
        <ScrollText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          Nenhuma ficha temática disponível para "{systemName || 'este sistema'}".
        </p>
      </div>
    );
  }

  const currentSection = sections[activeSection];

  return (
    <div className="space-y-6">
      {/* ═══ SHEET HEADER ═══ */}
      <div className={cn(
        "rounded-2xl border-2 p-6 sm:p-8 relative overflow-hidden",
        theme.sheetCardClass,
        theme.accentBorderClass
      )} style={theme.fontDisplay ? { fontFamily: theme.fontDisplay } : undefined}>
        {/* Subtle texture overlay */}
        {theme.hasTexture && (
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        )}

        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[hsl(var(--sheet-accent,270_48%_49%))] to-transparent opacity-40" />

        <div className="relative">
          {/* System & status */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <ScrollText className="h-5 w-5 text-[hsl(var(--sheet-accent,270_48%_49%))]" />
              <h2 className={cn("text-lg font-display font-bold", theme.sectionHeaderClass)}>
                {template.systemName}
              </h2>
            </div>
            <Badge
              variant={isSubmitted || isReviewed ? "default" : status === "draft" ? "secondary" : "outline"}
              className="text-xs gap-1"
            >
              {isSubmitted || isReviewed ? (
                <><CheckCircle2 className="h-3 w-3" /> Enviada</>
              ) : status === "draft" ? (
                <><Clock className="h-3 w-3" /> Rascunho</>
              ) : (
                <><AlertCircle className="h-3 w-3" /> Pendente</>
              )}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 mb-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso da ficha</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* GM instructions */}
          {gmInstructions && (
            <div className="rounded-xl border border-[hsl(var(--sheet-accent,270_48%_49%)/0.15)] bg-[hsl(var(--sheet-accent,270_48%_49%)/0.05)] p-4 mb-5">
              <p className="text-xs font-semibold text-[hsl(var(--sheet-accent,270_48%_49%))] mb-1">
                Instruções do Mestre
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{gmInstructions}</p>
            </div>
          )}

          {/* Deadline */}
          {deadlineAt && (
            <div className={cn(
              "flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-5",
              isPastDeadline ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground"
            )}>
              <Clock className="h-3.5 w-3.5" />
              Prazo: {new Date(deadlineAt).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric",
              })}
              {isPastDeadline && " (expirado)"}
            </div>
          )}

          {/* ═══ SECTION NAVIGATION ═══ */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 -mx-2 px-2 scrollbar-hide">
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(i)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  i === activeSection
                    ? "bg-[hsl(var(--sheet-accent,270_48%_49%)/0.12)] text-[hsl(var(--sheet-accent,270_48%_49%))] font-semibold"
                    : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* ═══ SECTION CONTENT ═══ */}
          {currentSection && (
            <motion.div
              key={currentSection.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SheetSectionBlock
                title={currentSection.title}
                subtitle={currentSection.subtitle}
                blockClass={theme.sectionBlockClass}
                headerClass={theme.sectionHeaderClass}
              >
                <SectionRenderer
                  section={currentSection}
                  theme={theme}
                  values={values}
                  setField={setField}
                  disabled={disabled}
                />
              </SheetSectionBlock>
            </motion.div>
          )}

          {/* Section navigation arrows */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              size="sm"
              disabled={activeSection === 0}
              onClick={() => setActiveSection((p) => p - 1)}
              className="gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              {activeSection + 1} / {sections.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={activeSection === sections.length - 1}
              onClick={() => setActiveSection((p) => p + 1)}
              className="gap-1 text-xs"
            >
              Próxima
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ ACTIONS ═══ */}
      {!isSubmitted && !isReviewed && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={saving}
            className="flex-1 gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Rascunho
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || progress < 100}
            className="flex-1 gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar Ficha
          </Button>
        </div>
      )}

      {(isSubmitted || isReviewed) && (
        <div className="rounded-xl bg-teal-50 border border-teal-200 p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-teal-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-teal-700">
            {isReviewed ? "Ficha revisada pelo Mestre ✅" : "Ficha enviada com sucesso!"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   Section Renderer — picks the right layout
   ════════════════════════════════════════════════ */

function SectionRenderer({
  section,
  theme,
  values,
  setField,
  disabled,
}: {
  section: SheetSectionDef;
  theme: SheetTheme;
  values: Record<string, any>;
  setField: (id: string, value: any) => void;
  disabled: boolean;
}) {
  switch (section.layout) {
    case "attribute-grid":
      return section.attributeGroups ? (
        <SheetAttributeGrid
          groups={section.attributeGroups}
          values={values}
          onChange={setField}
          disabled={disabled}
          filledClass={theme.dotFilledClass}
          emptyClass={theme.dotEmptyClass}
          labelClass={theme.labelClass}
          dotMax={section.dotMax || 5}
        />
      ) : null;

    case "ability-grid":
      return section.abilityGroups ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {section.abilityGroups.map((group) => (
            <div key={group.title}>
              <h4 className={cn("mb-3", theme.labelClass)}>
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.abilities.map((ab) => (
                  <div key={ab.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-foreground">{ab.label}</span>
                    <SheetDotRating
                      value={values[ab.id] || 0}
                      max={section.dotMax || 5}
                      onChange={(v) => setField(ab.id, v)}
                      disabled={disabled}
                      filledClass={theme.dotFilledClass}
                      emptyClass={theme.dotEmptyClass}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null;

    case "dot-list":
      return section.listFields ? (
        <div className="space-y-2.5">
          {section.listFields.map((lf) => (
            <div key={lf.id} className="flex items-center gap-3">
              <input
                type="text"
                value={values[`${lf.id}_name`] || ""}
                onChange={(e) => setField(`${lf.id}_name`, e.target.value)}
                disabled={disabled}
                placeholder="Nome do mérito"
                className="flex-1 bg-transparent border-0 border-b-2 border-border/30 px-1 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/25 focus:outline-none focus:border-[hsl(var(--sheet-accent,270_48%_49%))] transition-colors"
              />
              <SheetDotRating
                value={values[`${lf.id}_dots`] || 0}
                max={lf.dotMax}
                onChange={(v) => setField(`${lf.id}_dots`, v)}
                disabled={disabled}
                filledClass={theme.dotFilledClass}
                emptyClass={theme.dotEmptyClass}
                size="sm"
              />
            </div>
          ))}
        </div>
      ) : null;

    case "stats-row":
      return section.fields ? (
        <div className="space-y-4">
          {section.fields.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 flex-wrap">
              <span className={cn("text-sm font-medium text-foreground", theme.labelClass)}>{f.label}</span>
              {f.type === "dots" ? (
                <SheetDotRating
                  value={values[f.id] || 0}
                  max={f.dotMax || 10}
                  onChange={(v) => setField(f.id, v)}
                  disabled={disabled}
                  filledClass={theme.dotFilledClass}
                  emptyClass={theme.dotEmptyClass}
                  size="md"
                />
              ) : (
                <SheetNumberField
                  label=""
                  value={values[f.id] || 0}
                  onChange={(v) => setField(f.id, v)}
                  disabled={disabled}
                  min={f.min}
                  max={f.max}
                />
              )}
            </div>
          ))}
        </div>
      ) : null;

    case "health-track":
      return section.fields ? (
        <div className="flex flex-wrap gap-4">
          {section.fields.map((f) => (
            <div key={f.id} className="text-center">
              <SheetNumberField
                label={f.label}
                value={values[f.id] || 0}
                onChange={(v) => setField(f.id, v)}
                disabled={disabled}
                labelClass={theme.labelClass}
                min={f.min}
                max={f.max}
              />
            </div>
          ))}
        </div>
      ) : null;

    case "info-grid":
      return section.fields ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {section.fields.map((f) => (
            <div key={f.id} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
              <FieldRenderer field={f} theme={theme} values={values} setField={setField} disabled={disabled} />
            </div>
          ))}
        </div>
      ) : null;

    case "list":
      return section.fields ? (
        <div className="space-y-4">
          {section.fields.map((f) => (
            <FieldRenderer key={f.id} field={f} theme={theme} values={values} setField={setField} disabled={disabled} />
          ))}
        </div>
      ) : null;

    default:
      return null;
  }
}

/* ════════════════════════════════════════════════
   Field Renderer — individual field types
   ════════════════════════════════════════════════ */

function FieldRenderer({
  field,
  theme,
  values,
  setField,
  disabled,
}: {
  field: SheetFieldDef;
  theme: SheetTheme;
  values: Record<string, any>;
  setField: (id: string, value: any) => void;
  disabled: boolean;
}) {
  switch (field.type) {
    case "text":
      return (
        <SheetTextField
          label={field.label}
          value={values[field.id] || ""}
          onChange={(v) => setField(field.id, v)}
          disabled={disabled}
          labelClass={theme.labelClass}
          placeholder={field.placeholder}
          required={field.required}
        />
      );

    case "textarea":
      return (
        <SheetTextField
          label={field.label}
          value={values[field.id] || ""}
          onChange={(v) => setField(field.id, v)}
          disabled={disabled}
          labelClass={theme.labelClass}
          placeholder={field.placeholder}
          required={field.required}
          multiline
        />
      );

    case "number":
      return (
        <SheetNumberField
          label={field.label}
          value={values[field.id] || 0}
          onChange={(v) => setField(field.id, v)}
          disabled={disabled}
          labelClass={theme.labelClass}
          min={field.min}
          max={field.max}
          required={field.required}
        />
      );

    case "select":
      return (
        <div>
          <label className={cn("block mb-1", theme.labelClass)}>
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          <Select
            value={values[field.id] || ""}
            onValueChange={(v) => setField(field.id, v)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-transparent border-0 border-b-2 border-border/40 rounded-none focus:ring-0 focus:border-[hsl(var(--sheet-accent,270_48%_49%))]">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "dots":
      return (
        <div>
          <label className={cn("block mb-1.5", theme.labelClass)}>
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
          <SheetDotRating
            value={values[field.id] || 0}
            max={field.dotMax || 5}
            onChange={(v) => setField(field.id, v)}
            disabled={disabled}
            filledClass={theme.dotFilledClass}
            emptyClass={theme.dotEmptyClass}
          />
        </div>
      );

    default:
      return null;
  }
}
