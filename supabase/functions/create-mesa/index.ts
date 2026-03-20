import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-MESA] ${step}${d}`);
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
    logStep("User authenticated", { userId: user.id });

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name, name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) throw new Error("Profile not found");
    if (!["gm", "store"].includes(profile.role || "")) {
      throw new Error("Only GMs and stores can create mesas");
    }

    // Get connected Stripe account
    const { data: connectedAccount } = await supabase
      .from("connected_accounts")
      .select("stripe_connected_account_id, onboarding_status")
      .eq("user_id", user.id)
      .maybeSingle();

    const body = await req.json();
    const {
      title, description, system, session_type, format,
      city, venue, min_price, max_price, seats_total,
      start_at, end_at, tags, image_url, cover_image_url, play_styles, store_id,
      store_slot_id,
    } = body;

    if (!title || !system || !session_type || !format || !start_at) {
      throw new Error("Missing required fields: title, system, session_type, format, start_at");
    }

    const priceAmount = Math.max(0, Number(min_price) || 0);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let stripeProductId: string | null = null;
    let stripePriceId: string | null = null;

    // Only create Stripe product/price if there's a price > 0
    if (priceAmount > 0) {
      const stripeAccountId = connectedAccount?.stripe_connected_account_id;

      // Create product on the platform, with transfer_data to the connected account
      const product = await stripe.products.create({
        name: `Mesa: ${title}`,
        description: description || `${system} - ${session_type}`,
        metadata: {
          hivium_user_id: user.id,
          hivium_role: profile.role || "",
          mesa_system: system,
          mesa_format: format,
          ...(stripeAccountId ? { stripe_connected_account_id: stripeAccountId } : {}),
        },
      });

      stripeProductId = product.id;
      logStep("Stripe product created", { productId: product.id });

      // Create price in BRL (centavos)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(priceAmount * 100),
        currency: "brl",
        metadata: {
          hivium_user_id: user.id,
          ...(stripeAccountId ? { stripe_connected_account_id: stripeAccountId } : {}),
        },
      });

      stripePriceId = price.id;
      logStep("Stripe price created", { priceId: price.id, amount: priceAmount });
    }

    // Insert mesa
    const gmName = profile.display_name || profile.name || user.email || "Mestre";

    const mesaPayload: Record<string, unknown> = {
      title,
      description: description || null,
      system,
      session_type,
      format,
      city: city || null,
      venue: venue || null,
      min_price: priceAmount,
      max_price: Math.max(priceAmount, Number(max_price) || 0),
      seats_total: Number(seats_total) || 5,
      seats_available: Number(seats_total) || 5,
      gm_id: profile.role === "gm" ? user.id : (body.gm_id || user.id),
      gm_name: gmName,
      store_id: profile.role === "store" ? user.id : (store_id || null),
      start_at,
      end_at: end_at || null,
      status: "aberta",
      tags: tags || [],
      image_url: image_url || null,
      cover_image_url: cover_image_url || null,
      play_styles: play_styles || [],
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      store_slot_id: store_slot_id || null,
    };

    const { data: mesa, error: insertError } = await supabase
      .from("mesas")
      .insert(mesaPayload)
      .select("id")
      .single();

    if (insertError) throw new Error(`Failed to create mesa: ${insertError.message}`);

    logStep("Mesa created", { mesaId: mesa.id });

    return new Response(JSON.stringify({
      id: mesa.id,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
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
