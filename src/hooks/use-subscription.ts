import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type SubscriptionStatus =
  | "active"
  | "pending"
  | "trial"
  | "past_due"
  | "canceled"
  | "expired"
  | "inactive"
  | "none";

export interface Plan {
  id: string;
  code: string;
  role: string;
  name: string;
  description: string | null;
  price_monthly: number;
  feature_flags: Record<string, unknown> | string | number | boolean | null;
  sort_order: number;
}

export interface Subscription {
  id: string;
  plan_id: string | null;
  plan_name: string;
  plan_role: string;
  status: string;
  price_cents: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface SubscriptionState {
  loading: boolean;
  subscription: Subscription | null;
  plan: Plan | null;
  allPlans: Plan[];
  payments: Payment[];
  status: SubscriptionStatus;
  isActive: boolean;
  userRole: string | null;
  featureFlags: Record<string, unknown>;
  daysRemaining: number;
  refresh: () => Promise<void>;
  subscribe: (planCode: string) => Promise<boolean>;
  cancelSubscription: (immediate?: boolean) => Promise<boolean>;
  reactivateSubscription: () => Promise<boolean>;
  changePlan: (planCode: string) => Promise<boolean>;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const [profileRes, subRes, plansRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    setUserRole(profileRes.data?.role || null);
    setAllPlans((plansRes.data as Plan[]) || []);
    setPayments((paymentsRes.data as Payment[]) || []);

    const sub = subRes.data as Subscription | null;
    setSubscription(sub);

    if (sub?.plan_id) {
      const matchedPlan = (plansRes.data || []).find((p: Plan) => p.id === sub.plan_id);
      setPlan(matchedPlan || null);
    } else if (sub?.plan_name) {
      // Fallback: match by name
      const matchedPlan = (plansRes.data || []).find((p: Plan) => p.name === sub.plan_name);
      setPlan(matchedPlan || null);
    } else {
      setPlan(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const now = new Date();
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const isActive = !!subscription && subscription.status === "active" && !!periodEnd && periodEnd > now;
  const daysRemaining = periodEnd ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  let status: SubscriptionStatus = "none";
  if (subscription) {
    if (subscription.status === "active" && periodEnd && periodEnd > now) {
      status = subscription.cancel_at_period_end ? "canceled" : "active";
    } else if (subscription.status === "active" && periodEnd && periodEnd <= now) {
      status = "expired";
    } else if (subscription.status === "past_due") {
      status = "past_due";
    } else if (subscription.status === "canceled") {
      status = "canceled";
    } else if (subscription.status === "trial") {
      status = "trial";
    } else if (subscription.status === "pending") {
      status = "pending";
    } else {
      status = "inactive";
    }
  }

  const featureFlags = (plan?.feature_flags as Record<string, unknown>) || {};

  // ─── Actions (stub for MVP, Stripe-ready structure) ───

  const subscribe = useCallback(async (planCode: string): Promise<boolean> => {
    if (!user) return false;
    const targetPlan = allPlans.find((p) => p.code === planCode);
    if (!targetPlan) return false;

    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const { data: subData, error: subError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan_id: targetPlan.id,
      plan_name: targetPlan.name,
      plan_role: targetPlan.role,
      price_cents: targetPlan.price_monthly,
      status: "active",
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      provider: "manual",
    }).select("id").single();

    if (subError) return false;

    // Record payment
    await supabase.from("payments").insert({
      user_id: user.id,
      subscription_id: subData.id,
      amount: targetPlan.price_monthly,
      status: "paid",
      payment_type: "subscription",
      description: `Assinatura: ${targetPlan.name}`,
      paid_at: new Date().toISOString(),
    });

    await fetchData();
    return true;
  }, [user, allPlans, fetchData]);

  const cancelSubscription = useCallback(async (immediate = false): Promise<boolean> => {
    if (!user || !subscription) return false;

    if (immediate) {
      const { error } = await supabase.from("subscriptions").update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        cancel_at_period_end: false,
      }).eq("id", subscription.id);
      if (error) return false;
    } else {
      const { error } = await supabase.from("subscriptions").update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
      }).eq("id", subscription.id);
      if (error) return false;
    }

    await fetchData();
    return true;
  }, [user, subscription, fetchData]);

  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    if (!user || !subscription) return false;

    const periodEnd = new Date(subscription.current_period_end);
    const now = new Date();

    if (periodEnd > now) {
      // Still within period, just remove cancel flag
      const { error } = await supabase.from("subscriptions").update({
        cancel_at_period_end: false,
        canceled_at: null,
        status: "active",
      }).eq("id", subscription.id);
      if (error) return false;
    } else {
      // Expired — create new subscription
      if (plan) {
        return subscribe(plan.code);
      }
      return false;
    }

    await fetchData();
    return true;
  }, [user, subscription, plan, subscribe, fetchData]);

  const changePlan = useCallback(async (planCode: string): Promise<boolean> => {
    if (!user || !subscription) return false;
    const targetPlan = allPlans.find((p) => p.code === planCode);
    if (!targetPlan) return false;

    const { error } = await supabase.from("subscriptions").update({
      plan_id: targetPlan.id,
      plan_name: targetPlan.name,
      plan_role: targetPlan.role,
      price_cents: targetPlan.price_monthly,
    }).eq("id", subscription.id);

    if (error) return false;
    await fetchData();
    return true;
  }, [user, subscription, allPlans, fetchData]);

  return {
    loading,
    subscription,
    plan,
    allPlans,
    payments,
    status,
    isActive,
    userRole,
    featureFlags,
    daysRemaining,
    refresh: fetchData,
    subscribe,
    cancelSubscription,
    reactivateSubscription,
    changePlan,
  };
}
