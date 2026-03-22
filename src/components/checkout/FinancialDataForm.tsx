import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import type { FinancialRole } from "@/hooks/use-financial-readiness";

interface Props {
  role: FinancialRole;
  missingFields: string[];
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

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

const FIELD_LABELS: Record<string, string> = {
  full_name: "Nome completo",
  tax_document: "CPF ou CNPJ",
  billing_email: "E-mail de cobrança",
  mobile_phone: "Celular / WhatsApp",
  billing_phone: "Celular / WhatsApp",
  address_line: "Endereço (rua)",
  address_number: "Número",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado (UF)",
  zip_code: "CEP",
  birth_date: "Data de nascimento",
  company_type: "Tipo de empresa",
};

export function FinancialDataForm({ role, missingFields, onSaved, onCancel }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [taxDocument, setTaxDocument] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Pre-fill from existing data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: bp }, { data: profile }] = await Promise.all([
        supabase.from("billing_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("name, display_name, city, whatsapp").eq("user_id", user.id).maybeSingle(),
      ]);
      if (bp) {
        setFullName(bp.full_name || "");
        setTaxDocument(bp.tax_document || "");
        setBillingEmail(bp.billing_email || "");
        setMobilePhone(bp.billing_phone || "");
        setAddressLine(bp.address_line || "");
        setAddressNumber(bp.address_number || "");
        setNeighborhood(bp.neighborhood || "");
        setCity(bp.city || "");
        setState(bp.state || "");
        setZipCode(bp.zip_code || "");
      }
      // Fallbacks from profile
      if (!fullName && profile) setFullName(profile.display_name || profile.name || "");
      if (!billingEmail && user.email) setBillingEmail(user.email);
      if (!mobilePhone && profile?.whatsapp) setMobilePhone(profile.whatsapp);
      if (!city && profile?.city) setCity(profile.city);
    })();
  }, [user]);

  const isReceiver = role !== "player";

  const validate = (): boolean => {
    const doc = taxDocument.replace(/\D/g, "");
    if (!doc || (doc.length !== 11 && doc.length !== 14)) {
      setError("CPF (11 dígitos) ou CNPJ (14 dígitos) inválido.");
      return false;
    }
    if (!fullName.trim()) { setError("Nome completo é obrigatório."); return false; }
    if (!billingEmail.trim()) { setError("E-mail é obrigatório."); return false; }
    if (isReceiver) {
      if (!mobilePhone.replace(/\D/g, "")) { setError("Celular é obrigatório para recebedores."); return false; }
      if (!addressLine.trim()) { setError("Endereço é obrigatório."); return false; }
      if (!addressNumber.trim()) { setError("Número é obrigatório."); return false; }
      if (!neighborhood.trim()) { setError("Bairro é obrigatório."); return false; }
      if (!city.trim()) { setError("Cidade é obrigatória."); return false; }
      if (!state.trim()) { setError("Estado (UF) é obrigatório."); return false; }
      if (!zipCode.replace(/\D/g, "")) { setError("CEP é obrigatório."); return false; }
    }
    return true;
  };

  const handleSave = async () => {
    if (!user) return;
    setError("");
    if (!validate()) return;
    setSaving(true);

    try {
      const doc = taxDocument.replace(/\D/g, "");
      const phone = mobilePhone.replace(/\D/g, "");
      const cep = zipCode.replace(/\D/g, "");

      // Calculate readiness
      const requiredForRole = isReceiver
        ? [fullName, doc, billingEmail, phone, addressLine, addressNumber, neighborhood, city, state, cep]
        : [fullName, doc, billingEmail];
      const filled = requiredForRole.filter(v => v && v.trim() !== "").length;
      const pct = Math.round((filled / requiredForRole.length) * 100);
      const ready = pct === 100;

      const payload: Record<string, unknown> = {
        user_id: user.id,
        full_name: fullName.trim(),
        tax_document: doc,
        billing_email: billingEmail.trim(),
        billing_phone: phone || null,
        address_line: addressLine.trim() || null,
        address_number: addressNumber.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        state: state.trim().toUpperCase() || null,
        zip_code: cep || null,
        is_financial_ready: ready,
        financial_completion_percent: pct,
        last_validated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("billing_profiles")
        .upsert(payload as any, { onConflict: "user_id" });

      if (upsertError) throw upsertError;

      setSuccess(true);
      setTimeout(() => onSaved(), 800);
    } catch (err: any) {
      console.error("[FinancialDataForm]", err);
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        <p className="text-sm font-semibold text-foreground">Dados salvos com sucesso!</p>
        <p className="text-xs text-muted-foreground">Continuando…</p>
      </div>
    );
  }

  const needsField = (f: string) => missingFields.length === 0 || missingFields.includes(f);

  return (
    <div className="space-y-5 py-2">
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
        <p className="text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 inline mr-1 text-primary" />
          Esses dados são necessários para ativar pagamentos com segurança. Você só precisa preencher isso uma vez.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Name */}
        {needsField("full_name") && (
          <div className="space-y-1">
            <Label className="text-xs">{FIELD_LABELS.full_name} *</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
          </div>
        )}

        {/* CPF/CNPJ */}
        {needsField("tax_document") && (
          <div className="space-y-1">
            <Label className="text-xs">{FIELD_LABELS.tax_document} *</Label>
            <Input
              inputMode="numeric"
              value={formatCpfCnpj(taxDocument)}
              onChange={e => setTaxDocument(e.target.value.replace(/\D/g, ""))}
              placeholder="000.000.000-00"
              maxLength={18}
            />
          </div>
        )}

        {/* Email */}
        {needsField("billing_email") && (
          <div className="space-y-1">
            <Label className="text-xs">{FIELD_LABELS.billing_email} *</Label>
            <Input type="email" value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
        )}

        {/* Phone — show for receivers or if missing */}
        {(isReceiver || needsField("mobile_phone") || needsField("billing_phone")) && (
          <div className="space-y-1">
            <Label className="text-xs">{FIELD_LABELS.mobile_phone} {isReceiver ? "*" : ""}</Label>
            <Input
              inputMode="tel"
              value={formatPhone(mobilePhone)}
              onChange={e => setMobilePhone(e.target.value.replace(/\D/g, ""))}
              placeholder="(11) 99999-0000"
              maxLength={15}
            />
          </div>
        )}

        {/* Address fields — receivers only */}
        {isReceiver && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">{FIELD_LABELS.address_line} *</Label>
                <Input value={addressLine} onChange={e => setAddressLine(e.target.value)} placeholder="Rua, Av…" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{FIELD_LABELS.address_number} *</Label>
                <Input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="123" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{FIELD_LABELS.neighborhood} *</Label>
                <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{FIELD_LABELS.zip_code} *</Label>
                <Input
                  inputMode="numeric"
                  value={formatCep(zipCode)}
                  onChange={e => setZipCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{FIELD_LABELS.city} *</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="São Paulo" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{FIELD_LABELS.state} *</Label>
                <Input value={state} onChange={e => setState(e.target.value)} placeholder="SP" maxLength={2} className="uppercase" />
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel} disabled={saving}>
          Agora não
        </Button>
        <Button variant="gradient" className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {saving ? "Salvando…" : "Salvar e continuar"}
        </Button>
      </div>
    </div>
  );
}
