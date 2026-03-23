import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[ASAAS-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const sandboxKey = Deno.env.get("ASAAS_SANDBOX_KEY");
    const mainKey = Deno.env.get("ASAAS_API_KEY");
    const apiKey = sandboxKey || mainKey;
    if (!apiKey) throw new Error("No Asaas API key configured");

    const ASAAS_BASE = sandboxKey
      ? "https://sandbox.asaas.com/api/v3"
      : (mainKey?.startsWith("$aact_") ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const user = userData.user;
    const body = await req.json();

    const {
      plan_code,
      billing_type = "CREDIT_CARD",
      credit_card,          // {holderName, number, expiryMonth, expiryYear, ccv}
      credit_card_holder,   // {name, email, cpfCnpj, postalCode, addressNumber, phone}
      remote_ip,
      coupon_code,
    } = body;

    if (!plan_code) throw new Error("plan_code is required");

    log("Creating subscription", { userId: user.id, planCode: plan_code });

    // Get plan
    const { data: plan } = await supabase
      .from("billing_products")
      .select("*")
      .eq("code", plan_code)
      .eq("is_active", true)
      .eq("product_type", "subscription")
      .maybeSingle();

    if (!plan) throw new Error(`Plan '${plan_code}' not found`);

    // Ensure customer exists
    const { data: customer } = await supabase
      .from("asaas_customers")
      .select("asaas_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer?.asaas_id) {
      throw new Error("Asaas customer not found. Please register first.");
    }

    const amount = plan.price_cents / 100; // Asaas uses reais, not centavos
    const nextDueDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Build Asaas payload
    const asaasPayload: Record<string, unknown> = {
      customer: customer.asaas_id,
      billingType: billing_type,
      value: amount,
      nextDueDate,
      cycle: (plan.billing_cycle || "MONTHLY").toUpperCase(),
      description: `${plan.name} - HIVIUM`,
      externalReference: `plan:${plan_code}|user:${user.id}`,
    };

    // Credit card info
    if (billing_type === "CREDIT_CARD" && credit_card) {
      asaasPayload.creditCard = credit_card;
      asaasPayload.creditCardHolderInfo = credit_card_holder;
      if (remote_ip) asaasPayload.remoteIp = remote_ip;
    }

    // Discount (coupon)
    if (coupon_code) {
      // TODO: validate coupon and apply discount
      log("Coupon provided", { couponCode: coupon_code });
    }

    // Create subscription in Asaas
    const asaasRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey,
      },
      body: JSON.stringify(asaasPayload),
    });

    if (!asaasRes.ok) {
      const errBody = await asaasRes.text();
      log("Asaas API error", { status: asaasRes.status, body: errBody });
      throw new Error(`Asaas API error: ${asaasRes.status} - ${errBody}`);
    }

    const asaasSub = await asaasRes.json();
    log("Asaas subscription created", { asaasId: asaasSub.id });

    // Save to asaas_subscriptions
    await supabase.from("asaas_subscriptions").insert({
      user_id: user.id,
      asaas_id: asaasSub.id,
      billing_product_id: plan.id,
      billing_type,
      cycle: plan.billing_cycle || "MONTHLY",
      amount_cents: plan.price_cents,
      currency: "BRL",
      status: "ACTIVE",
      next_due_date: nextDueDate,
      description: `${plan.name} - HIVIUM`,
      external_reference: `plan:${plan_code}|user:${user.id}`,
    });

    // Also create/update legacy subscription for backward compat
    const periodEnd = new Date();
    if ((plan.billing_cycle || "MONTHLY") === "MONTHLY") {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else if (plan.billing_cycle === "YEARLY") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan_id: plan.id,
      plan_name: plan.name,
      plan_role: plan.target_role || "",
      status: "active",
      price_cents: plan.price_cents,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    });

    log("Subscription saved", { asaasId: asaasSub.id, planCode: plan_code });

    return new Response(JSON.stringify({
      asaas_subscription_id: asaasSub.id,
      plan_code: plan_code,
      plan_name: plan.name,
      status: "ACTIVE",
      next_due_date: nextDueDate,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
