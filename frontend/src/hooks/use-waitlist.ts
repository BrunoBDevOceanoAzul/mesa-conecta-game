import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useWaitlist(mesaId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!mesaId) return;

    const countRes = await supabase
      .from("mesa_waitlist")
      .select("id", { count: "exact", head: true })
      .eq("mesa_id", mesaId)
      .eq("status", "waiting");
    setWaitlistCount(countRes.count ?? 0);

    if (!user) return;
    const { data } = await supabase
      .from("mesa_waitlist")
      .select("id")
      .eq("mesa_id", mesaId)
      .eq("user_id", user.id)
      .eq("status", "waiting")
      .maybeSingle();
    setIsOnWaitlist(!!data);
  }, [mesaId, user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const joinWaitlist = async () => {
    if (!user || !mesaId) return;
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, name")
        .eq("user_id", user.id)
        .maybeSingle();

      const { error } = await supabase.from("mesa_waitlist").insert({
        mesa_id: mesaId,
        user_id: user.id,
        user_email: user.email,
        user_name: profile?.display_name || profile?.name || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Você já está na lista de espera!" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Você entrou na lista de espera! 🎲", description: "Avisaremos quando abrir vaga." });
      }
      setIsOnWaitlist(true);
      fetchStatus();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const leaveWaitlist = async () => {
    if (!user || !mesaId) return;
    setLoading(true);
    try {
      await supabase
        .from("mesa_waitlist")
        .update({ status: "canceled" })
        .eq("mesa_id", mesaId)
        .eq("user_id", user.id)
        .eq("status", "waiting");

      setIsOnWaitlist(false);
      toast({ title: "Saiu da lista de espera" });
      fetchStatus();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return { isOnWaitlist, waitlistCount, loading, joinWaitlist, leaveWaitlist };
}
