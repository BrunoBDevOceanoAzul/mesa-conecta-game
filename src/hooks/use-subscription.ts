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
  stripe_price_id: string | null;
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
  stripe_subscription_id: string | null;
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
  subscribe: (planCode: string, couponCode?: string) => Promise<boolean>;
  openCustomerPortal: () => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
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
  const [inTrial, setInTrial] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const [profileRes, subRes, plansRes, paymentsRes, trialRes] = await Promise.all([
      supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("plans").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.rpc("get_trial_status", { _user_id: user.id }),
    ]);

    setUserRole(profileRes.data?.role || null);
    setAllPlans((plansRes.data || []) as unknown as Plan[]);
    const trialData = trialRes.data as { in_trial?: boolean } | null;
    setInTrial(!!trialData?.in_trial);
    setPayments((paymentsRes.data as Payment[]) || []);

    const sub = subRes.data as Subscription | null;
    setSubscription(sub);

    if (sub?.plan_id) {
      const matchedPlan = (plansRes.data || []).find((p: any) => p.id === sub.plan_id);
      setPlan((matchedPlan as unknown as Plan) || null);
    } else if (sub?.plan_name) {
      const matchedPlan = (plansRes.data || []).find((p: any) => p.name === sub.plan_name);
      setPlan((matchedPlan as unknown as Plan) || null);
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
  const isActive = inTrial || (!!subscription && subscription.status === "active" && !!periodEnd && periodEnd > now);
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

  // ─── Subscribe via Stripe Checkout ───
  const subscribe = useCallback(async (planCode: string, couponCode?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan_code: planCode, coupon_code: couponCode },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Checkout error:", err);
      return false;
    }
  }, [user]);

  // ─── Open Stripe Customer Portal ───
  const openCustomerPortal = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: {},
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Customer portal error:", err);
      return false;
    }
  }, [user]);

  // ─── Cancel via Customer Portal ───
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    return openCustomerPortal();
  }, [openCustomerPortal]);

  // ─── Reactivate via Customer Portal ───
  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    return openCustomerPortal();
  }, [openCustomerPortal]);

  // ─── Change plan via Customer Portal ───
  const changePlan = useCallback(async (_planCode: string): Promise<boolean> => {
    return openCustomerPortal();
  }, [openCustomerPortal]);

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
    openCustomerPortal,
    cancelSubscription,
    reactivateSubscription,
    changePlan,
  };
}
