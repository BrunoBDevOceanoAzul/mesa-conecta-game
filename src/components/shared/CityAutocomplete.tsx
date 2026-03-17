import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Prediction {
  place_id: string;
  description: string;
}

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string, lat?: number, lng?: number) => void;
  placeholder?: string;
}

export function CityAutocomplete({ value, onChange, placeholder = "Buscar cidade..." }: CityAutocompleteProps) {
  const [query, setQuery] = useState(value || "");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPredictions = async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "autocomplete", input },
      });
      if (!error && data?.predictions) {
        setPredictions(data.predictions);
        setOpen(true);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300);
  };

  const handleSelect = async (prediction: Prediction) => {
    setQuery(prediction.description);
    setOpen(false);
    setPredictions([]);

    try {
      const { data, error } = await supabase.functions.invoke("google-maps-proxy", {
        body: { action: "place-details", input: prediction.place_id },
      });
      if (!error && data?.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        onChange(prediction.description, lat, lng);
      } else {
        onChange(prediction.description);
      }
    } catch {
      onChange(prediction.description);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          className="w-full rounded-lg border border-border bg-card pl-10 pr-10 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {open && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              onClick={() => handleSelect(p)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span>{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
