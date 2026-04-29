import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { RPG_SYSTEMS, TAGS, LANGUAGES, PLATFORMS, AVAILABLE_DAYS } from "@/data/onboarding-mesaquest";

interface StepPreferencesProps {
  data: {
    rpgSystems: string[];
    tags: string[];
    languages: string[];
    platforms: string[];
    availableDays: string[];
  };
  onChange: (field: string, value: unknown) => void;
  onPrev: () => void;
  onNext: () => void;
}

function MultiSelect({ label, options, selected, onChange, search }: {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  search?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));
  }, [options, query]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-2" ref={ref}>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-h-10 w-full items-center justify-between rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
        >
          <div className="flex gap-1 flex-wrap flex-1">
            {selected.length > 0 ? (
              selected.slice(0, 5).map((id) => {
                const opt = options.find((o) => o.id === id);
                return opt ? (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">
                    {opt.name}
                    <button onClick={(e) => { e.stopPropagation(); toggle(id); }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ) : null;
              })
            ) : (
              <span className="text-muted-foreground">Selecione...</span>
            )}
            {selected.length > 5 && (
              <span className="text-xs text-muted-foreground">+{selected.length - 5}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
            {search && (
              <div className="p-2 border-b border-border">
                <div className="flex items-center gap-2 rounded-md border border-border bg-input px-2 py-1.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Buscar..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto">
              {filtered.map((opt) => {
                const isSelected = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                    onClick={() => toggle(opt.id)}
                  >
                    <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${
                      isSelected ? "bg-primary border-primary" : "border-border"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    {opt.name}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">Nenhum resultado encontrado</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StepPreferences({ data, onChange, onPrev, onNext }: StepPreferencesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <MultiSelect
        label="Sistemas de RPG"
        options={RPG_SYSTEMS}
        selected={data.rpgSystems}
        onChange={(ids) => onChange("rpgSystems", ids)}
        search
      />

      <MultiSelect
        label="Temas e estilos preferidos"
        options={TAGS}
        selected={data.tags}
        onChange={(ids) => onChange("tags", ids)}
        search
      />

      <MultiSelect
        label="Idiomas"
        options={LANGUAGES}
        selected={data.languages}
        onChange={(ids) => onChange("languages", ids)}
      />

      <MultiSelect
        label="Plataformas"
        options={PLATFORMS}
        selected={data.platforms}
        onChange={(ids) => onChange("platforms", ids)}
        search
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Dias disponíveis</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_DAYS.map((day) => {
            const isSelected = data.availableDays.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => {
                  const current = data.availableDays;
                  if (current.includes(day.id)) {
                    onChange("availableDays", current.filter((d) => d !== day.id));
                  } else {
                    onChange("availableDays", [...current, day.id]);
                  }
                }}
                className={`px-3 py-2 rounded-md text-sm font-medium border transition-all ${
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-foreground hover:border-primary/40"
                }`}
              >
                {day.name.split("-")[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onPrev}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-card-hover text-foreground h-10 px-4 py-2 gap-2 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          Voltar
        </button>
        <div className="text-sm text-muted-foreground">Etapa 2 de 3</div>
        <button
          onClick={onNext}
          className="inline-flex items-center justify-center rounded-md text-sm font-semibold bg-accent text-muted hover:bg-accent-hover h-10 px-4 py-2 gap-2 transition-all"
        >
          Próximo
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
