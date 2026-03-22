import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-MESA] ${step}${d}`);
};

function getAsaasConfig() {
  const sandboxKey = Deno.env.get("ASAAS_SANDBOX_KEY");
  const mainKey = Deno.env.get("ASAAS_API_KEY");
  const apiKey = sandboxKey || mainKey;
  if (!apiKey) return null;
  const base = sandboxKey
    ? "https://sandbox.asaas.com/api/v3"
    : (mainKey?.startsWith("$aact_") ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3");
  return { apiKey, base };
}

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

    const body = await req.json();
    const {
      title, description, system, session_type, format,
      city, venue, min_price, max_price, seats_total,
      start_at, end_at, tags, image_url, cover_image_url, play_styles, store_id,
      store_slot_id, session_hours, campaign_sessions, is_subscription,
    } = body;

    if (!title || !system || !session_type || !format || !start_at) {
      throw new Error("Missing required fields: title, system, session_type, format, start_at");
    }

    const priceAmount = Math.max(0, Number(min_price) || 0);

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
      store_slot_id: store_slot_id || null,
    };

    const { data: mesa, error: insertError } = await supabase
      .from("mesas")
      .insert(mesaPayload)
      .select("id")
      .single();

    if (insertError) throw new Error(`Failed to create mesa: ${insertError.message}`);

    logStep("Mesa created", { mesaId: mesa.id });

    // Update store slot occupancy if linked
    if (store_slot_id) {
      await supabase.rpc("increment_slot_occupancy", { _slot_id: store_slot_id, _seats: Number(seats_total) || 5 })
        .then(() => logStep("Slot occupancy updated"))
        .catch((e: any) => logStep("WARN: Could not update slot", { error: e.message }));
    }

    // If price > 0 and it's a subscription (campaign), create Asaas billing product reference
    let asaasBillingId: string | null = null;

    if (priceAmount > 0 && is_subscription && campaign_sessions) {
      const asaasConfig = getAsaasConfig();
      if (asaasConfig) {
        // Get GM's Asaas subaccount
        const { data: asaasAccount } = await supabase
          .from("asaas_accounts")
          .select("asaas_id, api_key, wallet_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (asaasAccount?.asaas_id) {
          // Store the subscription config in mesa metadata for booking flow
          await supabase
            .from("mesas")
            .update({
              // Store subscription details so the booking flow can create subscriptions per player
              tags: [...(tags || []), "subscription"],
            })
            .eq("id", mesa.id);

          asaasBillingId = `mesa_sub_${mesa.id}`;
          logStep("Campaign subscription configured", {
            mesaId: mesa.id,
            sessions: campaign_sessions,
            sessionHours: session_hours,
            pricePerSession: priceAmount,
          });
        }
      }
    }

    return new Response(JSON.stringify({
      id: mesa.id,
      asaas_billing_id: asaasBillingId,
      session_hours: Number(session_hours) || 4,
      campaign_sessions: campaign_sessions || null,
      is_subscription: is_subscription || false,
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
