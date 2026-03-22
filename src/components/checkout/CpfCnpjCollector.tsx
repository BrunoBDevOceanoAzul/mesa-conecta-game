import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

interface CpfCnpjCollectorProps {
  onSaved: () => void;
  onCancel: () => void;
}

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function validateCpfCnpj(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return (digits.length === 11 || digits.length === 14) && !/^0+$/.test(digits);
}

export function CpfCnpjCollector({ onSaved, onCancel }: CpfCnpjCollectorProps) {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isValid = validateCpfCnpj(value);

  const handleSave = async () => {
    if (!user || !isValid) return;
    setSaving(true);
    setError("");

    const digits = value.replace(/\D/g, "");

    try {
      // Upsert in billing_profiles
      const { error: upsertError } = await supabase
        .from("billing_profiles")
        .upsert(
          { user_id: user.id, tax_document: digits },
          { onConflict: "user_id" }
        );

      if (upsertError) throw upsertError;

      // Also update profiles.cpf as fallback
      await supabase
        .from("profiles")
        .update({ cpf: digits })
        .eq("user_id", user.id);

      onSaved();
    } catch (err: any) {
      console.error("[CpfCnpjCollector] Save error:", err);
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Precisamos do seu CPF ou CNPJ
          </p>
          <p className="text-xs text-muted-foreground">
            Esse dado é exigido pela operadora de pagamento para gerar a cobrança. Você só precisa preencher uma vez.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf-cnpj" className="text-sm font-medium">
          CPF ou CNPJ
        </Label>
        <Input
          id="cpf-cnpj"
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00 ou 00.000.000/0001-00"
          value={formatCpfCnpj(value)}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          maxLength={18}
          autoFocus
        />
        {value.length > 0 && !isValid && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={onCancel}
          disabled={saving}
        >
          Agora não
        </Button>
        <Button
          variant="gradient"
          className="flex-1 gap-2"
          onClick={handleSave}
          disabled={!isValid || saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {saving ? "Salvando…" : "Salvar e continuar"}
        </Button>
      </div>
    </div>
  );
}
