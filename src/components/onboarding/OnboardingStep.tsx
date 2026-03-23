import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import { SearchableSystemSelect } from "@/components/shared/SearchableSystemSelect";
import { BioAvatarStep } from "@/components/onboarding/BioAvatarStep";
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
  avatarUrl?: string;
  onAvatarChange?: (url: string) => void;
  instagramHandle?: string;
  onInstagramChange?: (handle: string) => void;
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
  avatarUrl,
  onAvatarChange,
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-[100dvh] flex flex-col"
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.035]"
          style={{ background: "radial-gradient(circle, hsl(272 60% 58%), transparent 70%)" }}
        />
      </div>

      {/* Progress bar — minimal, elegant */}
      <div className="relative z-10 px-6 pt-6 pb-2">
        <div className="w-full max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-medium text-muted-foreground/50 tracking-wide">
              {current + 1} de {total}
            </span>
            <span className="text-[11px] font-semibold text-primary/60">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-[2px] rounded-full bg-border/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundImage: "var(--gradient-primary)" }}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              initial={{ opacity: 0, y: direction > 0 ? 20 : -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? -16 : 16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight tracking-tight">
                  {step.title}
                </h2>
                <p className="mt-2.5 text-[15px] text-muted-foreground/70 leading-relaxed">
                  {step.subtitle}
                </p>
              </div>

              {/* ── City autocomplete ── */}
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

              {/* ── Systems search ── */}
              {step.type === "systems-search" && (
                <SearchableSystemSelect
                  systems={RPG_SYSTEMS}
                  popularSystems={POPULAR_SYSTEMS}
                  selected={(value as string[]) || []}
                  onChange={(sel) => onChange(step.field, sel)}
                  placeholder="Buscar entre 600+ sistemas..."
                />
              )}

              {/* ── Cards single ── */}
              {step.type === "cards-single" && (
                <div className="grid gap-3">
                  {step.options?.map((opt, i) => {
                    const selected = value === opt.label;
                    return (
                      <motion.button
                        key={opt.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => onChange(step.field, opt.label)}
                        className={cn(
                          "group relative flex items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-300",
                          selected
                            ? "border-primary/50 bg-primary/[0.07] shadow-[0_0_30px_hsl(272_60%_58%_/_0.07)]"
                            : "border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50"
                        )}
                      >
                        {/* Radio indicator */}
                        <div
                          className={cn(
                            "h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                            selected
                              ? "border-primary bg-primary shadow-[0_0_8px_hsl(272_60%_58%_/_0.25)]"
                              : "border-muted-foreground/20 group-hover:border-muted-foreground/35"
                          )}
                        >
                          <motion.div
                            initial={false}
                            animate={{ scale: selected ? 1 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </motion.div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "font-semibold text-[15px] transition-colors duration-300",
                              selected ? "text-foreground" : "text-foreground/60"
                            )}
                          >
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className={cn(
                              "block text-[13px] mt-0.5 leading-snug transition-colors duration-300",
                              selected ? "text-muted-foreground" : "text-muted-foreground/50"
                            )}>
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ── Cards multi ── */}
              {step.type === "cards-multi" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {step.options?.map((opt, i) => {
                    const selected = ((value as string[]) || []).includes(opt.label);
                    return (
                      <motion.button
                        key={opt.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => toggleMulti(opt.label)}
                        className={cn(
                          "group relative flex flex-col items-center gap-2.5 rounded-2xl border p-5 text-center transition-all duration-300",
                          selected
                            ? "border-primary/50 bg-primary/[0.07] shadow-[0_0_20px_hsl(272_60%_58%_/_0.06)]"
                            : "border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50"
                        )}
                      >
                        <div
                          className={cn(
                            "h-4 w-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300",
                            selected
                              ? "border-primary bg-primary shadow-[0_0_6px_hsl(272_60%_58%_/_0.25)]"
                              : "border-muted-foreground/20 group-hover:border-muted-foreground/35"
                          )}
                        >
                          <motion.div
                            initial={false}
                            animate={{ scale: selected ? 1 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                          >
                            {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </motion.div>
                        </div>
                        <span
                          className={cn(
                            "text-[13px] font-semibold leading-tight transition-colors duration-300",
                            selected ? "text-foreground" : "text-foreground/50"
                          )}
                        >
                          {opt.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ── Chips multi ── */}
              {step.type === "chips-multi" && (
                <div>
                  <div className="flex flex-wrap gap-2.5">
                    {step.options?.map((opt, i) => {
                      const selected = ((value as string[]) || []).includes(opt.label);
                      return (
                        <motion.button
                          key={opt.label}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.025 }}
                          onClick={() => toggleMulti(opt.label)}
                          className={cn(
                            "rounded-full border px-5 py-3 text-[13px] font-semibold transition-all duration-300",
                            selected
                              ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_hsl(272_60%_58%_/_0.07)]"
                              : "border-border/30 bg-card/30 text-foreground/50 hover:border-border/50 hover:text-foreground/70"
                          )}
                        >
                          {opt.label}
                        </motion.button>
                      );
                    })}
                  </div>
                  {step.placeholder && onTextChange && (
                    <textarea
                      value={textValue || ""}
                      onChange={(e) => onTextChange(e.target.value)}
                      placeholder={step.placeholder}
                      rows={2}
                      className="mt-5 w-full rounded-2xl border border-border/30 bg-card/30 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/20 resize-none transition-all"
                    />
                  )}
                </div>
              )}

              {/* ── Days + Times ── */}
              {step.type === "days-times" && availabilityValue && onAvailabilityChange && (
                <div className="space-y-6">
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground/50 mb-3 uppercase tracking-[0.15em]">
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
                                ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_10px_hsl(272_60%_58%_/_0.07)]"
                                : "border-border/30 bg-card/30 text-foreground/40 hover:border-border/50 hover:text-foreground/60"
                            )}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground/50 mb-3 uppercase tracking-[0.15em]">
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
                                ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_10px_hsl(272_60%_58%_/_0.07)]"
                                : "border-border/30 bg-card/30 text-foreground/40 hover:border-border/50 hover:text-foreground/60"
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
                        ? "border-secondary/40 bg-secondary/8 text-secondary shadow-[0_0_10px_hsl(38_88%_55%_/_0.06)]"
                        : "border-border/30 bg-card/30 text-foreground/40 hover:border-secondary/25 hover:text-foreground/60"
                    )}
                  >
                    ✨ Agenda flexível
                  </button>
                </div>
              )}

              {/* ── Stepper ── */}
              {step.type === "stepper" && (
                <div className="flex flex-col items-center gap-5 py-6">
                  <div className="flex items-center gap-10">
                    <button
                      onClick={() => {
                        const cur = (value as number) || step.min || 2;
                        if (cur > (step.min || 1)) onChange(step.field, cur - 1);
                      }}
                      className="h-14 w-14 rounded-2xl border border-border/30 bg-card/30 flex items-center justify-center text-muted-foreground/50 hover:border-border/50 hover:text-foreground transition-all duration-300 active:scale-95"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <div className="text-center min-w-[5rem]">
                      <motion.span
                        key={value as number}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="text-5xl font-display font-bold text-foreground inline-block"
                      >
                        {(value as number) || step.min || 2}
                      </motion.span>
                    </div>
                    <button
                      onClick={() => {
                        const cur = (value as number) || step.min || 2;
                        if (cur < (step.max || 100)) onChange(step.field, cur + 1);
                      }}
                      className="h-14 w-14 rounded-2xl border border-border/30 bg-card/30 flex items-center justify-center text-muted-foreground/50 hover:border-border/50 hover:text-foreground transition-all duration-300 active:scale-95"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  {step.min !== undefined && step.max !== undefined && (
                    <p className="text-xs text-muted-foreground/35">
                      de {step.min} a {step.max}
                    </p>
                  )}
                </div>
              )}

              {/* ── Bio + Avatar ── */}
              {step.type === "bio-avatar" && onAvatarChange && (
                <BioAvatarStep
                  bio={(value as string) || ""}
                  avatarUrl={avatarUrl || ""}
                  onBioChange={(bio) => onChange(step.field, bio)}
                  onAvatarChange={onAvatarChange}
                />
              )}

              {/* ── Toggles ── */}
              {step.type === "toggles" && (
                <div className="grid gap-3">
                  {step.options?.map((opt, i) => {
                    const selected = ((value as string[]) || []).includes(opt.label);
                    return (
                      <motion.button
                        key={opt.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => toggleMulti(opt.label)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border p-5 transition-all duration-300",
                          selected
                            ? "border-primary/40 bg-primary/[0.05]"
                            : "border-border/30 bg-card/30 hover:border-border/50"
                        )}
                      >
                        <div className="text-left">
                          <span
                            className={cn(
                              "text-[15px] font-semibold transition-colors duration-300",
                              selected ? "text-foreground" : "text-foreground/60"
                            )}
                          >
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className={cn(
                              "block text-[13px] mt-0.5 leading-snug transition-colors duration-300",
                              selected ? "text-muted-foreground" : "text-muted-foreground/40"
                            )}>
                              {opt.description}
                            </span>
                          )}
                        </div>
                        <div
                          className={cn(
                            "w-12 h-7 rounded-full transition-all duration-300 flex items-center px-0.5 shrink-0 ml-4",
                            selected ? "bg-primary shadow-[0_0_10px_hsl(272_60%_58%_/_0.25)]" : "bg-border/50"
                          )}
                        >
                          <motion.div
                            animate={{ x: selected ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="w-6 h-6 rounded-full bg-white shadow-sm"
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Microcopy */}
              {step.microcopy && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 text-[13px] text-muted-foreground/40 leading-relaxed"
                >
                  {step.microcopy}
                </motion.p>
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
            className="text-muted-foreground/60 hover:text-foreground gap-1.5"
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
    </motion.div>
  );
}
