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
      .select("role, onboarding_completed, display_name, email, city, country")
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
      .select("id, stripe_connected_account_id, onboarding_status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.stripe_connected_account_id) {
      logStep("Account already exists", { accountId: existing.stripe_connected_account_id });

      // Generate a fresh onboarding link if not yet verified
      if (existing.onboarding_status !== "verified") {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
        const origin = req.headers.get("origin") || "https://mesa-conecta-game.lovable.app";

        const accountLink = await stripe.accountLinks.create({
          account: existing.stripe_connected_account_id,
          refresh_url: `${origin}/dashboard/${profile.role === "gm" ? "mestre" : "loja"}?connect=refresh`,
          return_url: `${origin}/dashboard/${profile.role === "gm" ? "mestre" : "loja"}?connect=complete`,
          type: "account_onboarding",
        });

        await supabase.from("connected_accounts").update({
          onboarding_url: accountLink.url,
        }).eq("id", existing.id);

        return new Response(JSON.stringify({
          already_exists: true,
          stripe_account_id: existing.stripe_connected_account_id,
          onboarding_url: accountLink.url,
          onboarding_status: existing.onboarding_status,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        already_exists: true,
        stripe_account_id: existing.stripe_connected_account_id,
        onboarding_status: existing.onboarding_status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe Connect Express account
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    const account = await stripe.accounts.create({
      type: "express",
      country: "BR",
      email: user.email || profile.email || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: profile.role === "store" ? "company" : "individual",
      metadata: {
        hivium_user_id: user.id,
        hivium_role: profile.role || "",
        platform: "hivium",
      },
    });

    logStep("Stripe Connect account created", { accountId: account.id });

    // Generate onboarding link
    const origin = req.headers.get("origin") || "https://mesa-conecta-game.lovable.app";
    const dashPath = profile.role === "gm" ? "mestre" : "loja";

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/dashboard/${dashPath}?connect=refresh`,
      return_url: `${origin}/dashboard/${dashPath}?connect=complete`,
      type: "account_onboarding",
    });

    // Save to database
    await supabase.from("connected_accounts").insert({
      user_id: user.id,
      role: profile.role || "",
      stripe_connected_account_id: account.id,
      stripe_account_type: "express",
      onboarding_status: "not_started",
      onboarding_url: accountLink.url,
      country: "BR",
      currency: "BRL",
      capabilities_json: account.capabilities || {},
    });

    logStep("Connected account saved to DB");

    return new Response(JSON.stringify({
      stripe_account_id: account.id,
      onboarding_url: accountLink.url,
      onboarding_status: "not_started",
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
