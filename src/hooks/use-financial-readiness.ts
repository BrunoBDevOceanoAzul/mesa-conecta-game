import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FinancialRole = "player" | "gm" | "store" | "brand";

interface FinancialReadiness {
  loading: boolean;
  isReady: boolean;
  completionPercent: number;
  missingFields: string[];
  billingProfile: BillingData | null;
  refetch: () => void;
}

interface BillingData {
  full_name: string | null;
  tax_document: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  mobile_phone: string | null;
  address_line: string | null;
  address_number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  birth_date: string | null;
  company_type: string | null;
  is_financial_ready: boolean;
}

/** Fields required per role category */
const PAYER_FIELDS = ["full_name", "tax_document", "billing_email"] as const;
const RECEIVER_FIELDS = [
  "full_name", "tax_document", "billing_email", "mobile_phone",
  "address_line", "address_number", "neighborhood", "city", "state", "zip_code",
] as const;

function getRequiredFields(role: FinancialRole): readonly string[] {
  if (role === "player") return PAYER_FIELDS;
  return RECEIVER_FIELDS; // gm, store, brand
}

export function useFinancialReadiness(role: FinancialRole = "player"): FinancialReadiness {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [billingProfile, setBillingProfile] = useState<BillingData | null>(null);

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("billing_profiles")
        .select("full_name, tax_document, billing_email, billing_phone, mobile_phone, address_line, address_number, neighborhood, city, state, zip_code, birth_date, company_type, is_financial_ready")
        .eq("user_id", user.id)
        .maybeSingle();

      setBillingProfile(data as BillingData | null);
    } catch (err) {
      console.error("[useFinancialReadiness]", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const { isReady, completionPercent, missingFields } = useMemo(() => {
    const required = getRequiredFields(role);
    if (!billingProfile) {
      return { isReady: false, completionPercent: 0, missingFields: [...required] };
    }
    const missing: string[] = [];
    for (const f of required) {
      const val = (billingProfile as any)[f];
      if (!val || (typeof val === "string" && val.trim() === "")) {
        missing.push(f);
      }
    }
    const filled = required.length - missing.length;
    const pct = Math.round((filled / required.length) * 100);
    return { isReady: missing.length === 0, completionPercent: pct, missingFields: missing };
  }, [billingProfile, role]);

  return { loading, isReady, completionPercent, missingFields, billingProfile, refetch: fetch };
}
