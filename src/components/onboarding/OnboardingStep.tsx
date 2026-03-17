import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import { SearchableSystemSelect } from "@/components/shared/SearchableSystemSelect";
import { RPG_SYSTEMS, POPULAR_SYSTEMS } from "@/data/rpg-systems";
import { ChevronLeft, ChevronRight, Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OnboardingStep as StepConfig } from "@/lib/onboarding-steps";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const TIMES = ["Manhã", "Tarde", "Noite", "Madrugada"];

interface StepProps {
  step: StepConfig;
  value: unknown;
  onChange: (field: string, value: unknown) => void;
  onNext: () => void;
  onPrev: () => void;
  current: number;
  total: number;
  direction: number;
  isLast: boolean;
  saving: boolean;
  onFinish: () => void;
  coords: { lat?: number; lng?: number };
  onCoordsChange: (c: { lat?: number; lng?: number }) => void;
  // For days-times, we store { days: string[], times: string[] }
  availabilityValue?: { days: string[]; times: string[] };
  onAvailabilityChange?: (v: { days: string[]; times: string[] }) => void;
  // For text-optional (avoid step has both chips + text)
  textValue?: string;
  onTextChange?: (v: string) => void;
}

export function OnboardingStepView({
  step,
  value,
  onChange,
  onNext,
  onPrev,
  current,
  total,
  direction,
  isLast,
  saving,
  onFinish,
  coords,
  onCoordsChange,
  availabilityValue,
  onAvailabilityChange,
  textValue,
  onTextChange,
}: StepProps) {
  const progress = ((current + 1) / total) * 100;

  const canNext = () => {
    if (!step.required) return true;
    if (step.type === "city-autocomplete") return !!(value as string)?.trim();
    if (step.type === "cards-single") return !!value;
    if (step.type === "stepper") return value !== undefined && value !== null;
    if (step.type === "chips-multi" || step.type === "cards-multi") return ((value as string[]) || []).length > 0;
    return true;
  };

  const toggleMulti = (opt: string) => {
    const arr = ((value as string[]) || []);
    const next = arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt];
    onChange(step.field, next);
  };

  const toggleToggle = (opt: string) => {
    const arr = ((value as string[]) || []);
    const next = arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt];
    onChange(step.field, next);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col px-6 py-8 md:py-12">
      {/* Progress bar */}
      <div className="w-full max-w-lg mx-auto mb-8">
        <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-medium">
          <span>Passo {current + 1} de {total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundImage: "var(--gradient-primary)" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground leading-tight">
              {step.title}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.subtitle}</p>

            <div className="mt-7">
              {/* City autocomplete */}
              {step.type === "city-autocomplete" && (
                <CityAutocomplete
                  value={(value as string) || ""}
                  onChange={(city, lat, lng) => {
                    onChange(step.field, city);
                    if (lat && lng) onCoordsChange({ lat, lng });
                  }}
                  placeholder="Buscar cidade..."
                />
              )}

              {/* Systems search */}
              {step.type === "systems-search" && (
                <SearchableSystemSelect
                  systems={RPG_SYSTEMS}
                  popularSystems={POPULAR_SYSTEMS}
                  selected={((value as string[]) || [])}
                  onChange={(sel) => onChange(step.field, sel)}
                  placeholder="Buscar entre 600+ sistemas..."
                />
              )}

              {/* Cards single */}
              {step.type === "cards-single" && (
                <div className="grid gap-2.5">
                  {step.options?.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => onChange(step.field, opt.label)}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                        value === opt.label
                          ? "border-primary bg-primary/[0.06] shadow-[0_0_20px_hsl(272_60%_58%_/_0.06)]"
                          : "border-border bg-card hover:border-primary/20"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        value === opt.label ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {value === opt.label && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "font-medium text-sm",
                          value === opt.label ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className="block text-xs text-muted-foreground/70 mt-0.5">{opt.description}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Cards multi */}
              {step.type === "cards-multi" && (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {step.options?.map((opt) => {
                    const selected = ((value as string[]) || []).includes(opt.label);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => toggleMulti(opt.label)}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200",
                          selected
                            ? "border-primary bg-primary/[0.06] shadow-[0_0_15px_hsl(272_60%_58%_/_0.06)]"
                            : "border-border bg-card hover:border-primary/20"
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                          selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                        )}>
                          {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <span className={cn(
                          "text-sm font-medium leading-tight",
                          selected ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Chips multi */}
              {step.type === "chips-multi" && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {step.options?.map((opt) => {
                      const selected = ((value as string[]) || []).includes(opt.label);
                      return (
                        <button
                          key={opt.label}
                          onClick={() => toggleMulti(opt.label)}
                          className={cn(
                            "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/20"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {step.placeholder && onTextChange && (
                    <textarea
                      value={textValue || ""}
                      onChange={(e) => onTextChange(e.target.value)}
                      placeholder={step.placeholder}
                      rows={2}
                      className="mt-4 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  )}
                </div>
              )}

              {/* Days + Times */}
              {step.type === "days-times" && availabilityValue && onAvailabilityChange && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">Dias</p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((d) => {
                        const sel = availabilityValue.days.includes(d);
                        return (
                          <button
                            key={d}
                            onClick={() => {
                              const next = sel
                                ? availabilityValue.days.filter((x) => x !== d)
                                : [...availabilityValue.days, d];
                              onAvailabilityChange({ ...availabilityValue, days: next });
                            }}
                            className={cn(
                              "w-12 h-12 rounded-xl border text-sm font-medium transition-all duration-200",
                              sel
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:border-primary/20"
                            )}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wider">Horários</p>
                    <div className="flex flex-wrap gap-2">
                      {TIMES.map((t) => {
                        const sel = availabilityValue.times.includes(t);
                        return (
                          <button
                            key={t}
                            onClick={() => {
                              const next = sel
                                ? availabilityValue.times.filter((x) => x !== t)
                                : [...availabilityValue.times, t];
                              onAvailabilityChange({ ...availabilityValue, times: next });
                            }}
                            className={cn(
                              "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                              sel
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-muted-foreground hover:border-primary/20"
                            )}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => onAvailabilityChange({ days: [], times: ["Flexível"] })}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      availabilityValue.times.includes("Flexível")
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/20"
                    )}
                  >
                    Agenda flexível
                  </button>
                </div>
              )}

              {/* Stepper */}
              {step.type === "stepper" && (
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => {
                      const cur = (value as number) || step.min || 2;
                      if (cur > (step.min || 1)) onChange(step.field, cur - 1);
                    }}
                    className="h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <div className="text-center">
                    <span className="text-4xl font-display font-bold text-foreground">
                      {(value as number) || step.min || 2}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const cur = (value as number) || step.min || 2;
                      if (cur < (step.max || 100)) onChange(step.field, cur + 1);
                    }}
                    className="h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Toggles */}
              {step.type === "toggles" && (
                <div className="grid gap-2.5">
                  {step.options?.map((opt) => {
                    const selected = ((value as string[]) || []).includes(opt.label);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => toggleToggle(opt.label)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border p-4 transition-all duration-200",
                          selected
                            ? "border-primary bg-primary/[0.06]"
                            : "border-border bg-card hover:border-primary/20"
                        )}
                      >
                        <div className="text-left">
                          <span className={cn("text-sm font-medium", selected ? "text-foreground" : "text-muted-foreground")}>
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className="block text-xs text-muted-foreground/70 mt-0.5">{opt.description}</span>
                          )}
                        </div>
                        <div className={cn(
                          "w-11 h-6 rounded-full transition-all duration-200 flex items-center px-0.5",
                          selected ? "bg-primary" : "bg-muted"
                        )}>
                          <div className={cn(
                            "w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                            selected ? "translate-x-5" : "translate-x-0"
                          )} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Microcopy */}
            {step.microcopy && (
              <p className="mt-5 text-xs text-muted-foreground/60 italic">{step.microcopy}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-lg mx-auto pt-6 flex justify-between">
        <Button variant="ghost" onClick={onPrev} className="text-muted-foreground">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Button>
        {isLast ? (
          <Button variant="gradient" onClick={onFinish} disabled={!canNext() || saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              "Revisar perfil"
            )}
          </Button>
        ) : (
          <Button variant="default" onClick={onNext} disabled={!canNext()}>
            Continuar <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
