import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSystemSelectProps {
  systems: string[];
  popularSystems?: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxVisible?: number;
}

export function SearchableSystemSelect({
  systems,
  popularSystems = [],
  selected,
  onChange,
  placeholder = "Buscar sistema...",
  maxVisible = 8,
}: SearchableSystemSelectProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return systems.filter((s) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
    ).slice(0, 50);
  }, [query, systems]);

  const showPopular = focused && !query.trim();
  const showResults = focused && query.trim().length > 0;

  const toggle = (system: string) => {
    if (selected.includes(system)) {
      onChange(selected.filter((s) => s !== system));
    } else {
      onChange([...selected, system]);
    }
  };

  const renderItem = (system: string, isPopular = false) => {
    const isSelected = selected.includes(system);
    return (
      <button
        key={system}
        type="button"
        onClick={() => toggle(system)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all",
          isSelected
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <div
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
            isSelected ? "border-primary bg-primary" : "border-muted"
          )}
        >
          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
        </div>
        <span className="flex-1 truncate">{system}</span>
        {isPopular && <Star className="h-3 w-3 text-accent shrink-0" />}
      </button>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {selected.slice(0, maxVisible).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                className="hover:text-primary/70 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selected.length > maxVisible && (
            <span className="inline-flex items-center rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              +{selected.length - maxVisible} mais
            </span>
          )}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {(showPopular || showResults) && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl max-h-72 overflow-y-auto">
          {showPopular && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 text-accent" /> Mais populares
              </div>
              {popularSystems.map((s) => renderItem(s, true))}
            </div>
          )}

          {showResults && (
            <div className="p-2">
              {filtered.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-xs text-muted-foreground">
                    {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                  </div>
                  {filtered.map((s) => renderItem(s))}
                </>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Nenhum sistema encontrado para "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        {selected.length} sistema{selected.length !== 1 ? "s" : ""} selecionado{selected.length !== 1 ? "s" : ""} · {systems.length} disponíveis
      </p>
    </div>
  );
}
