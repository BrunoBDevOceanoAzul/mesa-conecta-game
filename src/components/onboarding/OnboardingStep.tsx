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
  availabilityValue?: { days: string[]; times: string[] };
  onAvailabilityChange?: (v: { days: string[]; times: string[] }) => void;
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
    const arr = (value as string[]) || [];
    const next = arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt];
    onChange(step.field, next);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(272 60% 58%), transparent 70%)" }}
        />
      </div>

      {/* Top bar: progress */}
      <div className="relative z-10 px-6 pt-6 pb-2">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
              {current + 1} / {total}
            </span>
            <span className="text-[11px] font-medium text-primary/70">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-[3px] rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundImage: "var(--gradient-primary)" }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight tracking-tight">
                  {step.title}
                </h2>
                <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                  {step.subtitle}
                </p>
              </div>

              {/* Interaction area */}
              <div className="space-y-0">
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
                    selected={(value as string[]) || []}
                    onChange={(sel) => onChange(step.field, sel)}
                    placeholder="Buscar entre 600+ sistemas..."
                  />
                )}

                {/* Cards single */}
                {step.type === "cards-single" && (
                  <div className="grid gap-3">
                    {step.options?.map((opt) => {
                      const selected = value === opt.label;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => onChange(step.field, opt.label)}
                          className={cn(
                            "group relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-300",
                            selected
                              ? "border-primary/50 bg-primary/[0.08] shadow-[0_0_30px_hsl(272_60%_58%_/_0.08)]"
                              : "border-border/60 bg-card/50 hover:border-primary/25 hover:bg-card/80"
                          )}
                        >
                          <div
                            className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                              selected
                                ? "border-primary bg-primary shadow-[0_0_10px_hsl(272_60%_58%_/_0.3)]"
                                : "border-muted-foreground/25 group-hover:border-muted-foreground/40"
                            )}
                          >
                            {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={cn(
                                "font-semibold text-[15px] transition-colors",
                                selected ? "text-foreground" : "text-foreground/70"
                              )}
                            >
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span className="block text-[13px] text-muted-foreground mt-0.5 leading-snug">
                                {opt.description}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Cards multi */}
                {step.type === "cards-multi" && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {step.options?.map((opt) => {
                      const selected = ((value as string[]) || []).includes(opt.label);
                      return (
                        <button
                          key={opt.label}
                          onClick={() => toggleMulti(opt.label)}
                          className={cn(
                            "group relative flex flex-col items-center gap-2.5 rounded-2xl border p-5 text-center transition-all duration-300",
                            selected
                              ? "border-primary/50 bg-primary/[0.08] shadow-[0_0_25px_hsl(272_60%_58%_/_0.07)]"
                              : "border-border/60 bg-card/50 hover:border-primary/25 hover:bg-card/80"
                          )}
                        >
                          <div
                            className={cn(
                              "h-4 w-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                              selected
                                ? "border-primary bg-primary shadow-[0_0_8px_hsl(272_60%_58%_/_0.3)]"
                                : "border-muted-foreground/25 group-hover:border-muted-foreground/40"
                            )}
                          >
                            {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </div>
                          <span
                            className={cn(
                              "text-[13px] font-semibold leading-tight transition-colors",
                              selected ? "text-foreground" : "text-foreground/60"
                            )}
                          >
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
                    <div className="flex flex-wrap gap-2.5">
                      {step.options?.map((opt) => {
                        const selected = ((value as string[]) || []).includes(opt.label);
                        return (
                          <button
                            key={opt.label}
                            onClick={() => toggleMulti(opt.label)}
                            className={cn(
                              "rounded-full border px-5 py-3 text-[13px] font-semibold transition-all duration-300",
                              selected
                                ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_hsl(272_60%_58%_/_0.08)]"
                                : "border-border/60 bg-card/50 text-foreground/60 hover:border-primary/25 hover:text-foreground/80"
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
                        className="mt-5 w-full rounded-2xl border border-border/60 bg-card/50 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 resize-none transition-all"
                      />
                    )}
                  </div>
                )}

                {/* Days + Times */}
                {step.type === "days-times" && availabilityValue && onAvailabilityChange && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground/70 mb-3 uppercase tracking-[0.15em]">
                        Dias
                      </p>
                      <div className="flex flex-wrap gap-2.5">
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
                                "w-[3.25rem] h-[3.25rem] rounded-2xl border text-sm font-semibold transition-all duration-300",
                                sel
                                  ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_hsl(272_60%_58%_/_0.08)]"
                                  : "border-border/60 bg-card/50 text-foreground/50 hover:border-primary/25 hover:text-foreground/70"
                              )}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground/70 mb-3 uppercase tracking-[0.15em]">
                        Horários
                      </p>
                      <div className="flex flex-wrap gap-2.5">
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
                                "rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300",
                                sel
                                  ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_hsl(272_60%_58%_/_0.08)]"
                                  : "border-border/60 bg-card/50 text-foreground/50 hover:border-primary/25 hover:text-foreground/70"
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
                        "rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-300",
                        availabilityValue.times.includes("Flexível")
                          ? "border-secondary/50 bg-secondary/10 text-secondary shadow-[0_0_12px_hsl(38_88%_55%_/_0.08)]"
                          : "border-border/60 bg-card/50 text-foreground/50 hover:border-secondary/25 hover:text-foreground/70"
                      )}
                    >
                      ✨ Agenda flexível
                    </button>
                  </div>
                )}

                {/* Stepper */}
                {step.type === "stepper" && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="flex items-center gap-8">
                      <button
                        onClick={() => {
                          const cur = (value as number) || step.min || 2;
                          if (cur > (step.min || 1)) onChange(step.field, cur - 1);
                        }}
                        className="h-14 w-14 rounded-2xl border border-border/60 bg-card/50 flex items-center justify-center text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-300 active:scale-95"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <div className="text-center min-w-[5rem]">
                        <motion.span
                          key={value as number}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-5xl font-display font-bold text-foreground"
                        >
                          {(value as number) || step.min || 2}
                        </motion.span>
                      </div>
                      <button
                        onClick={() => {
                          const cur = (value as number) || step.min || 2;
                          if (cur < (step.max || 100)) onChange(step.field, cur + 1);
                        }}
                        className="h-14 w-14 rounded-2xl border border-border/60 bg-card/50 flex items-center justify-center text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-300 active:scale-95"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    {step.min !== undefined && step.max !== undefined && (
                      <p className="text-xs text-muted-foreground/50">
                        de {step.min} a {step.max}
                      </p>
                    )}
                  </div>
                )}

                {/* Toggles */}
                {step.type === "toggles" && (
                  <div className="grid gap-3">
                    {step.options?.map((opt) => {
                      const selected = ((value as string[]) || []).includes(opt.label);
                      return (
                        <button
                          key={opt.label}
                          onClick={() => toggleMulti(opt.label)}
                          className={cn(
                            "flex items-center justify-between rounded-2xl border p-5 transition-all duration-300",
                            selected
                              ? "border-primary/40 bg-primary/[0.06]"
                              : "border-border/60 bg-card/50 hover:border-primary/20"
                          )}
                        >
                          <div className="text-left">
                            <span
                              className={cn(
                                "text-[15px] font-semibold transition-colors",
                                selected ? "text-foreground" : "text-foreground/70"
                              )}
                            >
                              {opt.label}
                            </span>
                            {opt.description && (
                              <span className="block text-[13px] text-muted-foreground mt-0.5 leading-snug">
                                {opt.description}
                              </span>
                            )}
                          </div>
                          <div
                            className={cn(
                              "w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 shrink-0 ml-4",
                              selected ? "bg-primary shadow-[0_0_10px_hsl(272_60%_58%_/_0.3)]" : "bg-muted/80"
                            )}
                          >
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300",
                                selected ? "translate-x-5" : "translate-x-0"
                              )}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Microcopy */}
              {step.microcopy && (
                <p className="mt-6 text-[13px] text-muted-foreground/50 leading-relaxed">
                  {step.microcopy}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 px-6 pb-8 pt-4">
        <div className="w-full max-w-lg mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={onPrev}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
          {isLast ? (
            <Button
              variant="gradient"
              size="lg"
              onClick={onFinish}
              disabled={!canNext() || saving}
              className="px-8"
            >
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
            <Button
              variant="gradient"
              size="lg"
              onClick={onNext}
              disabled={!canNext()}
              className="px-8 gap-1.5"
            >
              Continuar <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
