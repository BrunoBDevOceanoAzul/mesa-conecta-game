import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ConnectedAccount {
  id: string;
  stripe_connected_account_id: string | null;
  onboarding_status: string;
  onboarding_url: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  application_fee_percent: number;
  role: string;
}

export function useConnectedAccount() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchAccount = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setAccount(data as ConnectedAccount | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  const ensureAccount = useCallback(async () => {
    if (!user) return null;
    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account");
      if (error) throw error;
      await fetchAccount();
      return data;
    } catch (err) {
      console.error("Failed to create connect account:", err);
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
