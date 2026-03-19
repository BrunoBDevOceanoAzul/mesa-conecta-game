import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface AvailabilityRule {
  id: string;
  user_id: string;
  role: string;
  rule_type: string;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  start_date: string | null;
  end_date: string | null;
  timezone: string;
  is_active: boolean;
  availability_type: string;
  accepted_formats_json: string[];
  accepted_modalities_json: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityException {
  id: string;
  user_id: string;
  role: string;
  exception_date: string;
  exception_type: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewRule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  accepted_formats_json?: string[];
  accepted_modalities_json?: string[];
  notes?: string;
}

export interface NewException {
  exception_date: string;
  exception_type: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
}

export function useAvailability(role: "gm" | "store") {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [rulesRes, excRes] = await Promise.all([
        supabase
          .from("availability_rules")
          .select("*")
          .eq("user_id", user.id)
          .eq("role", role)
          .order("day_of_week", { ascending: true }),
        supabase
          .from("availability_exceptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("role", role)
          .order("exception_date", { ascending: true }),
      ]);
      setRules((rulesRes.data as any[]) || []);
      setExceptions((excRes.data as any[]) || []);
    } catch (err) {
      console.error("[useAvailability] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, role]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addRule = async (data: NewRule) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("availability_rules").insert({
      user_id: user.id,
      role,
      rule_type: "weekly_recurring",
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      accepted_formats_json: data.accepted_formats_json || [],
      accepted_modalities_json: data.accepted_modalities_json || [],
      notes: data.notes || null,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar horário", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Horário adicionado" });
    await fetchAll();
    return true;
  };

  const updateRule = async (id: string, data: Partial<NewRule & { is_active: boolean }>) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("availability_rules").update(data as any).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
      return false;
    }
    toast({ title: "Horário atualizado" });
    await fetchAll();
    return true;
  };

  const deleteRule = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("availability_rules").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
      return false;
    }
    toast({ title: "Horário removido" });
    await fetchAll();
    return true;
  };

  const addException = async (data: NewException) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("availability_exceptions").insert({
      user_id: user.id,
      role,
      exception_date: data.exception_date,
      exception_type: data.exception_type,
      start_time: data.start_time || null,
      end_time: data.end_time || null,
      notes: data.notes || null,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar exceção", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "Exceção adicionada" });
    await fetchAll();
    return true;
  };

  const deleteException = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("availability_exceptions").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover exceção", variant: "destructive" });
      return false;
    }
    toast({ title: "Exceção removida" });
    await fetchAll();
    return true;
  };

  const copyRuleToDays = async (ruleId: string, targetDays: number[]) => {
    if (!user) return;
    const source = rules.find((r) => r.id === ruleId);
    if (!source) return;
    setSaving(true);
    const inserts = targetDays.map((day) => ({
      user_id: user.id,
      role,
      rule_type: "weekly_recurring",
      day_of_week: day,
      start_time: source.start_time,
      end_time: source.end_time,
      accepted_formats_json: source.accepted_formats_json,
      accepted_modalities_json: source.accepted_modalities_json,
      notes: source.notes,
    }));
    const { error } = await supabase.from("availability_rules").insert(inserts as any[]);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao copiar", variant: "destructive" });
      return false;
    }
    toast({ title: `Horário copiado para ${targetDays.length} dia(s)` });
    await fetchAll();
    return true;
  };

  // Group rules by day
  const rulesByDay = rules.reduce<Record<number, AvailabilityRule[]>>((acc, r) => {
    if (r.day_of_week != null) {
      (acc[r.day_of_week] = acc[r.day_of_week] || []).push(r);
    }
    return acc;
  }, {});

  // Future exceptions only
  const futureExceptions = exceptions.filter(
    (e) => new Date(e.exception_date) >= new Date(new Date().toDateString())
  );

  return {
    rules,
    exceptions,
    rulesByDay,
    futureExceptions,
    loading,
    saving,
    addRule,
    updateRule,
    deleteRule,
    addException,
    deleteException,
    copyRuleToDays,
    refetch: fetchAll,
  };
}
