import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[BOOKING-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

// Fee constants
const PLATFORM_SPLIT_PERCENT = 5; // HIVIUM takes 5%
const ASAAS_PIX_PERCENT = 1.99;
const ASAAS_CARD_PERCENT = 2.99;
const ASAAS_BOLETO_FIXED = 1.99; // R$1.99

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
    const apiKey = Deno.env.get("ASAAS_API_KEY");
    if (!apiKey) throw new Error("ASAAS_API_KEY not set");

    const ASAAS_BASE = apiKey.startsWith("$aact_")
      ? "https://api.asaas.com/v3"
      : "https://sandbox.asaas.com/api/v3";

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const player = userData.user;
    const body = await req.json();

    const {
      booking_id,
      mesa_id,
      billing_type = "PIX",
      amount, // Total amount in BRL (e.g., 50.00)
    } = body;

    if (!booking_id || !mesa_id || !amount || amount <= 0) {
      throw new Error("booking_id, mesa_id, and amount > 0 are required");
    }

    log("Creating booking payment with split", { playerId: player.id, bookingId: booking_id, amount, billingType: billing_type });

    // Get mesa to find GM and optional Store
    const { data: mesa } = await supabase
      .from("mesas")
      .select("id, title, gm_user_id, store_user_id, price_per_player")
      .eq("id", mesa_id)
      .maybeSingle();

    if (!mesa) throw new Error("Mesa not found");

    // Get player's Asaas customer
    const { data: playerCustomer } = await supabase
      .from("asaas_customers")
      .select("asaas_id")
      .eq("user_id", player.id)
      .maybeSingle();

    if (!playerCustomer?.asaas_id) {
      throw new Error("Player not registered as Asaas customer");
    }

    // Get GM's wallet
    const { data: gmAccount } = await supabase
      .from("asaas_accounts")
      .select("wallet_id, asaas_id")
      .eq("user_id", mesa.gm_user_id)
      .maybeSingle();

    // Get Store wallet if applicable
    let storeAccount: { wallet_id: string | null } | null = null;
    if (mesa.store_user_id) {
      const { data: sa } = await supabase
        .from("asaas_accounts")
        .select("wallet_id")
        .eq("user_id", mesa.store_user_id)
        .maybeSingle();
      storeAccount = sa;
    }

    // Calculate splits
    const platformAmount = +(amount * PLATFORM_SPLIT_PERCENT / 100).toFixed(2);
    let gmAmount: number;
    let storeAmount = 0;

    if (storeAccount?.wallet_id) {
      // Mesa in a store: split 50/50 between GM and Store after platform cut
      const sellerPool = amount - platformAmount;
      gmAmount = +(sellerPool * 0.5).toFixed(2);
      storeAmount = +(sellerPool - gmAmount).toFixed(2);
    } else {
      // Online/independent: GM gets everything minus platform
      gmAmount = +(amount - platformAmount).toFixed(2);
    }

    // Build split array for Asaas
    const splitRules: { walletId: string; fixedValue: number }[] = [];

    if (gmAccount?.wallet_id) {
      splitRules.push({ walletId: gmAccount.wallet_id, fixedValue: gmAmount });
    }
    if (storeAccount?.wallet_id) {
      splitRules.push({ walletId: storeAccount.wallet_id, fixedValue: storeAmount });
    }
    // Platform keeps the remainder automatically (main wallet)

    log("Split calculated", {
      total: amount,
      platform: platformAmount,
      gm: gmAmount,
      store: storeAmount,
      splits: splitRules.length,
    });

    // Build payment payload
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const asaasPayload: Record<string, unknown> = {
      customer: playerCustomer.asaas_id,
      billingType: billing_type,
      value: amount,
      dueDate,
      description: `Reserva: ${mesa.title || "Mesa RPG"} - HIVIUM`,
      externalReference: `booking:${booking_id}`,
    };

    if (splitRules.length > 0) {
      asaasPayload.split = splitRules;
    }

    // Create payment in Asaas
    const asaasRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify(asaasPayload),
    });

    if (!asaasRes.ok) {
      const errBody = await asaasRes.text();
      log("Asaas API error", { status: asaasRes.status, body: errBody });
      throw new Error(`Asaas API error: ${asaasRes.status} - ${errBody}`);
    }

    const asaasPayment = await asaasRes.json();
    log("Payment created", { asaasId: asaasPayment.id });

    // Get PIX QR code
    let pixData: { encodedImage?: string; payload?: string; expirationDate?: string } = {};
    if (billing_type === "PIX" && asaasPayment.id) {
      const pixRes = await fetch(`${ASAAS_BASE}/payments/${asaasPayment.id}/pixQrCode`, {
        headers: { "access_token": apiKey },
      });
      if (pixRes.ok) {
        pixData = await pixRes.json();
      }
    }

    // Save to DB
    const splitJson = {
      platform: { percent: PLATFORM_SPLIT_PERCENT, amount: platformAmount },
      gm: { user_id: mesa.gm_user_id, wallet_id: gmAccount?.wallet_id, amount: gmAmount },
      ...(storeAccount?.wallet_id ? {
        store: { user_id: mesa.store_user_id, wallet_id: storeAccount.wallet_id, amount: storeAmount }
      } : {}),
      asaas_fee_estimate: billing_type === "PIX"
        ? +(amount * ASAAS_PIX_PERCENT / 100).toFixed(2)
        : billing_type === "CREDIT_CARD"
          ? +(amount * ASAAS_CARD_PERCENT / 100).toFixed(2)
          : ASAAS_BOLETO_FIXED,
    };

    await supabase.from("asaas_payments").insert({
      user_id: player.id,
      asaas_id: asaasPayment.id,
      booking_id,
      mesa_id,
      billing_type,
      amount_cents: Math.round(amount * 100),
      net_amount_cents: asaasPayment.netValue ? Math.round(asaasPayment.netValue * 100) : null,
      currency: "BRL",
      status: asaasPayment.status || "PENDING",
      due_date: dueDate,
      invoice_url: asaasPayment.invoiceUrl || null,
      bank_slip_url: asaasPayment.bankSlipUrl || null,
      pix_qr_code: pixData.encodedImage || null,
      pix_copy_paste: pixData.payload || null,
      description: `Reserva: ${mesa.title}`,
      external_reference: `booking:${booking_id}`,
      split_json: splitJson,
    });

    // Update booking with payment info
    await supabase.from("bookings").update({
      payment_status: "pending",
      amount: Math.round(amount * 100),
      currency: "BRL",
      updated_at: new Date().toISOString(),
    }).eq("id", booking_id);

    return new Response(JSON.stringify({
      asaas_id: asaasPayment.id,
      status: asaasPayment.status,
      invoice_url: asaasPayment.invoiceUrl,
      pix_qr_code: pixData.encodedImage || null,
      pix_copy_paste: pixData.payload || null,
      pix_expiration: pixData.expirationDate || null,
      due_date: dueDate,
      split_breakdown: splitJson,
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
