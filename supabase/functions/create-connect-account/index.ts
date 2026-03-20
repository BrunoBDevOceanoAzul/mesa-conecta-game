import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONNECT] ${step}${d}`);
};

const ELIGIBLE_ROLES = ["gm", "store"];

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

    // Get profile to check role and onboarding status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed, display_name, name, email, city, country")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) throw new Error("Profile not found");
    if (!profile.onboarding_completed) throw new Error("Onboarding not completed");
    if (!ELIGIBLE_ROLES.includes(profile.role || "")) {
      throw new Error(`Role '${profile.role}' is not eligible for Stripe Connect`);
    }

    logStep("Profile validated", { role: profile.role });

    // Check if connected account already exists
    const { data: existing } = await supabase
      .from("connected_accounts")
      .select("id, stripe_connected_account_id, onboarding_status, charges_enabled, payouts_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.stripe_connected_account_id) {
      logStep("Account already exists", { accountId: existing.stripe_connected_account_id });

      return new Response(JSON.stringify({
        already_exists: true,
        stripe_account_id: existing.stripe_connected_account_id,
        onboarding_status: existing.onboarding_status,
        charges_enabled: existing.charges_enabled,
        payouts_enabled: existing.payouts_enabled,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe Connect Custom account (platform-managed, zero friction)
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const displayName = profile.display_name || profile.name || undefined;
    const accountEmail = user.email || profile.email || undefined;

    const account = await stripe.accounts.create({
      country: "BR",
      email: accountEmail,
      controller: {
        losses: { payments: "application" },
        fees: { payer: "application" },
        requirement_collection: "application",
        stripe_dashboard: { type: "none" },
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: profile.role === "store" ? "company" : "individual",
      ...(profile.role !== "store" && displayName
        ? {
            individual: {
              email: accountEmail,
              first_name: displayName.split(" ")[0] || displayName,
              last_name: displayName.split(" ").slice(1).join(" ") || undefined,
            },
          }
        : {}),
      ...(profile.role === "store" && displayName
        ? {
            company: {
              name: displayName,
            },
            business_profile: {
              name: displayName,
              mcc: "5945", // Hobby, Toy, and Game Shops
              url: `https://sociodotabuleiro.app.br`,
            },
          }
        : {
            business_profile: {
              mcc: "7941", // Recreation Services
              url: `https://sociodotabuleiro.app.br`,
            },
          }),
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            req.headers.get("cf-connecting-ip") ||
            "0.0.0.0",
      },
      metadata: {
        hivium_user_id: user.id,
        hivium_role: profile.role || "",
        platform: "hivium",
      },
    });

    logStep("Custom Connect account created", { accountId: account.id });

    // Determine initial status based on account state
    let onboardingStatus = "pending";
    if (account.charges_enabled && account.payouts_enabled) {
      onboardingStatus = "verified";
    } else if (account.details_submitted) {
      onboardingStatus = "submitted";
    }

    // Save to database
    await supabase.from("connected_accounts").insert({
      user_id: user.id,
      role: profile.role || "",
      stripe_connected_account_id: account.id,
      stripe_account_type: "custom",
      onboarding_status: onboardingStatus,
      onboarding_url: null,
      country: "BR",
      currency: "BRL",
      charges_enabled: account.charges_enabled ?? false,
      payouts_enabled: account.payouts_enabled ?? false,
      details_submitted: account.details_submitted ?? false,
      capabilities_json: account.capabilities || {},
      requirements_json: account.requirements || {},
    });

    logStep("Connected account saved to DB", { status: onboardingStatus });

    // Audit log
    await supabase.from("audit_log").insert({
      event_type: "connect_account_created",
      actor_id: user.id,
      actor_email: user.email,
      target_type: "connected_account",
      target_id: account.id,
      details_json: {
        account_type: "custom",
        role: profile.role,
        status: onboardingStatus,
      },
      source: "create-connect-account",
    });

    return new Response(JSON.stringify({
      stripe_account_id: account.id,
      onboarding_status: onboardingStatus,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
