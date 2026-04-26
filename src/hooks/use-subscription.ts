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

/* ─── Map billing_products row → Plan interface ─── */
function toBillingPlan(bp: any): Plan {
  return {
    id: bp.id,
    code: bp.code,
    role: bp.target_role || "player",
    name: bp.name,
    description: bp.description,
    price_monthly: bp.price_cents,
    stripe_price_id: bp.stripe_price_id,
    feature_flags: bp.feature_flags,
    sort_order: bp.sort_order ?? 99,
  };
}

/* ─── Map asaas_subscriptions row → Subscription interface ─── */
function toSubscription(row: any, plan?: Plan | null): Subscription {
  const nextDue = row.next_due_date ? new Date(row.next_due_date) : null;
  const createdAt = new Date(row.created_at);
  // Estimate period start as created_at (or last payment)
  const periodStart = createdAt.toISOString();
  // Estimate period end as next_due_date or +30d
  const periodEnd = nextDue
    ? nextDue.toISOString()
    : new Date(createdAt.getTime() + 30 * 86400000).toISOString();

  return {
    id: row.id,
    plan_id: row.billing_product_id,
    plan_name: plan?.name || row.description || "Assinatura",
    plan_role: plan?.role || "player",
    status: row.status === "ACTIVE" ? "active"
      : row.status === "PENDING" ? "pending"
      : row.status === "OVERDUE" ? "past_due"
      : row.status === "CANCELLED" || row.status === "EXPIRED" ? "canceled"
      : row.status,
    price_cents: row.amount_cents,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: !!row.canceled_at,
    canceled_at: row.canceled_at,
    created_at: row.created_at,
    stripe_subscription_id: row.asaas_id,
  };
}

/* ─── Map asaas_payments row → Payment interface ─── */
function toPayment(row: any): Payment {
  return {
    id: row.id,
    amount: row.amount_cents,
    currency: row.currency || "BRL",
    status: row.status === "CONFIRMED" || row.status === "RECEIVED" ? "paid"
      : row.status === "REFUNDED" ? "refunded"
      : row.status === "OVERDUE" ? "failed"
      : row.status === "PENDING" || row.status === "AWAITING_RISK_ANALYSIS" ? "pending"
      : row.status.toLowerCase(),
    payment_type: row.billing_type || "PIX",
    description: row.description,
    paid_at: row.paid_at,
    created_at: row.created_at,
  };
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
    if (!user) { setLoading(false); return; }

    const [profileRes, subRes, productsRes, paymentsRes, trialRes] = await Promise.all([
      supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("asaas_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("billing_products").select("*").eq("is_active", true).eq("product_type", "subscription").order("sort_order"),
      supabase.from("asaas_payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.rpc("get_trial_status", { _user_id: user.id }),
    ]);

    setUserRole(profileRes.data?.role || null);

    const products = (productsRes.data || []).map(toBillingPlan);
    setAllPlans(products);

    const trialData = trialRes.data as { in_trial?: boolean } | null;
    setInTrial(!!trialData?.in_trial);

    setPayments((paymentsRes.data || []).map(toPayment));

    const subRow = subRes.data;
    if (subRow) {
      const matchedPlan = products.find((p) => p.id === subRow.billing_product_id) || null;
      setPlan(matchedPlan);
      setSubscription(toSubscription(subRow, matchedPlan));
    } else {
      // Fallback: check old subscriptions table for backwards compat
      const { data: legacySub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (legacySub) {
        const lp = products.find((p) => p.id === legacySub.plan_id || p.name === legacySub.plan_name) || null;
        setPlan(lp);
        setSubscription(legacySub as Subscription);
      } else {
        setPlan(null);
        setSubscription(null);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Derived state ───
  const now = new Date();
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const isActive = inTrial || (!!subscription && subscription.status === "active" && !!periodEnd && periodEnd > now);
  const daysRemaining = periodEnd ? Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  let status: SubscriptionStatus = "none";
  if (inTrial && !subscription) {
    status = "trial";
  } else if (subscription) {
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

  // ─── Subscribe via Asaas ───
  const subscribe = useCallback(async (planCode: string, _couponCode?: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase.functions.invoke("create-asaas-subscription", {
        body: { plan_code: planCode },
      });

      if (error) {
        const errorBody = (data && typeof data === "object") ? (data as Record<string, unknown>) : {};
        const message =
          (typeof errorBody.message === "string" && errorBody.message) ||
          (typeof errorBody.error === "string" && errorBody.error) ||
          error.message ||
          "Erro ao criar assinatura";

        console.error("Asaas subscription error:", {
          message,
          errorCode: errorBody.error_code,
          rawError: error,
        });
        return false;
      }

      if (data && typeof data === "object" && "error" in data) {
        console.error("Asaas subscription error:", data);
        return false;
      }

      // Refresh after creation
      await fetchData();
      return true;
    } catch (err) {
      console.error("Asaas subscription error:", err);
      return false;
    }
  }, [user, fetchData]);

  // ─── No external portal — redirect to billing page ───
  const openCustomerPortal = useCallback(async (): Promise<boolean> => {
    window.location.href = "/billing";
    return true;
  }, []);

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!subscription?.stripe_subscription_id) return false;
    // Not yet implemented — requires Asaas subscription cancellation API
    return false;
  }, [subscription]);

  const reactivateSubscription = useCallback(async (): Promise<boolean> => {
    // Not yet implemented — requires Asaas subscription reactivation API
    return false;
  }, []);

  const changePlan = useCallback(async (_planCode: string): Promise<boolean> => {
    // Change plan = create new subscription, cancel old
    return subscribe(_planCode);
  }, [subscribe]);

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
