import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[BOOKING-CHECKOUT] ${step}${d}`);
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

    const { mesa_id } = await req.json();
    if (!mesa_id) throw new Error("mesa_id is required");

    // Fetch mesa details
    const { data: mesa, error: mesaError } = await supabase
      .from("mesas")
      .select("id, title, min_price, stripe_price_id, stripe_product_id, gm_id, gm_name, seats_available, seats_total, system, format")
      .eq("id", mesa_id)
      .maybeSingle();

    if (mesaError || !mesa) throw new Error("Mesa not found");
    if (mesa.seats_available <= 0) throw new Error("Mesa is full — no seats available");
    if (!mesa.stripe_price_id) throw new Error("Mesa has no Stripe price configured");

    // Check if already booked
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("game_table_id", mesa.id)
      .eq("player_user_id", user.id)
      .neq("status", "canceled")
      .maybeSingle();

    if (existingBooking) throw new Error("You already have a booking for this mesa");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || "https://mesa-conecta-game.lovable.app";

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email!, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
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
    }

    logStep("Stripe customer ready", { customerId });

    // Get GM's connected account for transfer
    const { data: gmConnected } = await supabase
      .from("connected_accounts")
      .select("stripe_connected_account_id, application_fee_percent")
      .eq("user_id", mesa.gm_id)
      .eq("onboarding_status", "verified")
      .maybeSingle();

    // Create a pending booking first (so we can link it)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        game_table_id: mesa.id,
        player_user_id: user.id,
        gm_user_id: mesa.gm_id,
        seats_reserved: 1,
        status: "pending_payment",
        amount: Math.round(mesa.min_price * 100),
        currency: "brl",
        payment_status: "pending",
        source_type: "platform",
        booked_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`);
    logStep("Pending booking created", { bookingId: booking.id });

    // Build Checkout Session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: mesa.stripe_price_id, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/mesa/${mesa.id}?booking=success&booking_id=${booking.id}`,
      cancel_url: `${origin}/mesa/${mesa.id}?booking=canceled&booking_id=${booking.id}`,
      metadata: {
        type: "mesa_booking",
        hivium_user_id: user.id,
        hivium_mesa_id: mesa.id,
        hivium_booking_id: booking.id,
        hivium_gm_id: mesa.gm_id,
      },
      payment_intent_data: {
        metadata: {
          type: "mesa_booking",
          hivium_booking_id: booking.id,
          hivium_mesa_id: mesa.id,
          hivium_gm_id: mesa.gm_id,
        },
        ...(gmConnected?.stripe_connected_account_id
          ? {
              transfer_data: {
                destination: gmConnected.stripe_connected_account_id,
              },
              application_fee_amount: Math.round(
                mesa.min_price * 100 * ((gmConnected.application_fee_percent || 10) / 100)
              ),
            }
          : {}),
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, bookingId: booking.id });

    // Store checkout session id on booking for reconciliation
    await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", booking.id);

    // Audit
    await supabase.from("audit_log").insert({
      event_type: "booking_checkout_initiated",
      actor_id: user.id,
      actor_email: user.email,
      target_type: "booking",
      target_id: booking.id,
      details_json: { mesa_id: mesa.id, session_id: session.id, amount: mesa.min_price },
      source: "create-booking-checkout",
    });

    return new Response(JSON.stringify({ url: session.url, booking_id: booking.id }), {
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
