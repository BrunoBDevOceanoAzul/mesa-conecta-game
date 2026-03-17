import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { plan_code, credit_package_code, coupon_code, success_url, cancel_url } = body;

    if (!plan_code && !credit_package_code) {
      throw new Error("Either plan_code or credit_package_code is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://mesa-conecta-game.lovable.app";

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer", { customerId });
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, name")
        .eq("user_id", user.id)
        .maybeSingle();

      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.display_name || profile?.name || undefined,
        metadata: { hivium_user_id: user.id },
      });
      customerId = customer.id;
      logStep("Created Stripe customer", { customerId });
    }

    // ─── Subscription checkout ───
    if (plan_code) {
      const { data: plan } = await supabase
        .from("plans")
        .select("*")
        .eq("code", plan_code)
        .eq("is_active", true)
        .maybeSingle();

      if (!plan) throw new Error(`Plan '${plan_code}' not found or inactive`);
      if (!plan.stripe_price_id) throw new Error(`Plan '${plan_code}' has no Stripe price configured`);

      logStep("Plan found", { code: plan.code, priceId: plan.stripe_price_id });

      // Check for existing active subscription
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (existingSubs.data.length > 0) {
        throw new Error("User already has an active subscription. Use customer portal to change plans.");
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        mode: "subscription",
        success_url: success_url || `${origin}/billing?checkout=success`,
        cancel_url: cancel_url || `${origin}/billing?checkout=cancel`,
        subscription_data: {
          metadata: {
            hivium_user_id: user.id,
            hivium_plan_code: plan.code,
            hivium_plan_id: plan.id,
          },
        },
        metadata: {
          type: "subscription",
          hivium_user_id: user.id,
          hivium_plan_code: plan.code,
        },
        allow_promotion_codes: true,
      };

      // Apply coupon if provided
      if (coupon_code) {
        const { data: coupon } = await supabase
          .from("discount_coupons")
          .select("stripe_coupon_id, stripe_promotion_code_id")
          .eq("public_code", coupon_code.toUpperCase())
          .eq("is_active", true)
          .maybeSingle();

        if (coupon?.stripe_coupon_id) {
          sessionParams.discounts = [{ coupon: coupon.stripe_coupon_id }];
          sessionParams.allow_promotion_codes = false;
          logStep("Coupon applied", { code: coupon_code });
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      logStep("Checkout session created", { sessionId: session.id, mode: "subscription" });

      // Audit log
      await supabase.from("audit_log").insert({
        event_type: "checkout_initiated",
        actor_id: user.id,
        actor_email: user.email,
        target_type: "plan",
        target_id: plan.id,
        details_json: { plan_code: plan.code, session_id: session.id },
        source: "create-checkout",
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Credit package checkout (one-time) ───
    if (credit_package_code) {
      const { data: pkg } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("code", credit_package_code)
        .eq("is_active", true)
        .maybeSingle();

      if (!pkg) throw new Error(`Credit package '${credit_package_code}' not found`);
      if (!pkg.stripe_price_id) throw new Error(`Credit package '${credit_package_code}' has no Stripe price`);

      logStep("Credit package found", { code: pkg.code, credits: pkg.credits_amount });

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
        mode: "payment",
        success_url: success_url || `${origin}/billing?checkout=credits_success`,
        cancel_url: cancel_url || `${origin}/billing?checkout=cancel`,
        metadata: {
          type: "credit_purchase",
          credits_amount: String(pkg.credits_amount),
          hivium_user_id: user.id,
          package_code: pkg.code,
        },
      });

      logStep("Checkout session created", { sessionId: session.id, mode: "payment" });

      await supabase.from("audit_log").insert({
        event_type: "credit_checkout_initiated",
        actor_id: user.id,
        actor_email: user.email,
        target_type: "credit_package",
        target_id: pkg.id,
        details_json: { package_code: pkg.code, credits: pkg.credits_amount, session_id: session.id },
        source: "create-checkout",
      });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid request");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
