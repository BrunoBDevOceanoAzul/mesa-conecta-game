import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ConnectedAccount {
  id: string;
  asaas_id: string | null;
  onboarding_status: string;
  general_status: string | null;
  commercial_info_status: string | null;
  documents_status: string | null;
  bank_account_status: string | null;
  wallet_id: string | null;
  name: string;
  email: string | null;
  cpf_cnpj: string | null;
  person_type: string;
  account_type: string;
  // Compat fields
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  role: string;
}

function mapAccount(row: any): ConnectedAccount {
  const gs = row.general_status || "PENDING";
  return {
    id: row.id,
    asaas_id: row.asaas_id,
    onboarding_status: row.onboarding_status,
    general_status: row.general_status,
    commercial_info_status: row.commercial_info_status,
    documents_status: row.documents_status,
    bank_account_status: row.bank_account_status,
    wallet_id: row.wallet_id,
    name: row.name,
    email: row.email,
    cpf_cnpj: row.cpf_cnpj,
    person_type: row.person_type,
    account_type: row.account_type,
    // Derive compat flags from Asaas status
    charges_enabled: gs === "APPROVED" || gs === "ACTIVE",
    payouts_enabled: gs === "APPROVED" || gs === "ACTIVE",
    details_submitted: row.onboarding_status === "completed" || row.onboarding_status === "submitted",
    role: row.account_type || "gm",
  };
}

export function useConnectedAccount() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAccount = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("asaas_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setAccount(data ? mapAccount(data) : null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  const ensureAccount = useCallback(async () => {
    if (!user) return null;
    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-asaas-subaccount");
      if (error) throw error;
      await fetchAccount();
      return data;
    } catch (err) {
      console.error("Failed to create Asaas subaccount:", err);
      return null;
    } finally {
      setCreating(false);
    }
  }, [user, fetchAccount]);

  const isReady = account?.charges_enabled && account?.payouts_enabled;
  const isPending = account && !isReady;
  const needsCreation = !account;

  return {
    loading,
    account,
    creating,
    isReady,
    isPending,
    needsCreation,
    ensureAccount,
    refresh: fetchAccount,
  };
}
