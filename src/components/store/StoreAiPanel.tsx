import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, FileText, Instagram, MessageSquare } from "lucide-react";
import { StoreAiImagePanel } from "./StoreAiImagePanel";

interface StoreAiPanelProps {
  storeName: string;
  city?: string;
  description?: string;
  capacity?: number;
}

export function StoreAiPanel({ storeName, city, description, capacity }: StoreAiPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);

  const generate = async (type: string) => {
    setLoading(true);
    setActiveType(type);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("store-ai-content", {
        body: { type, store_name: storeName, city, description, capacity },
      });
      if (error) throw new Error(error.message);
      setResult(data?.content || "Sem resultado");
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copiado!" });
  };

  const actions = [
    { type: "description", label: "Gerar Descrição", icon: <FileText className="h-4 w-4" />, desc: "Texto completo para o perfil" },
    { type: "social_post", label: "Post Instagram", icon: <Instagram className="h-4 w-4" />, desc: "Post + hashtags + CTA" },
    { type: "welcome_message", label: "Boas-vindas", icon: <MessageSquare className="h-4 w-4" />, desc: "Mensagem para novos visitantes" },
  ];

  return (
    <div className="space-y-8">
      {/* ─── Text Content Studio ─── */}
      <div className="space-y-4">
        <h3 className="text-base font-display font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Estúdio IA — Textos
        </h3>

        <div className="grid gap-3 sm:grid-cols-3">
          {actions.map((a) => (
            <button
              key={a.type}
              onClick={() => generate(a.type)}
              disabled={loading}
              className={`rounded-xl border p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.98] ${
                activeType === a.type ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {a.icon}
                <span className="text-sm font-medium text-foreground">{a.label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{a.desc}</p>
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando conteúdo com IA...
          </div>
        )}

        {result && !loading && (
          <div className="space-y-2">
            <Textarea value={result} readOnly rows={8} className="text-sm" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" /> Copiar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Image Generator ─── */}
      <div className="border-t border-border pt-6">
        <StoreAiImagePanel storeName={storeName} city={city} />
      </div>
    </div>
  );
}
