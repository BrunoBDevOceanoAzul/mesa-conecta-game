import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[BOOKING-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

const PLATFORM_SPLIT_PERCENT = 5;

/** Strip formatting and validate CPF (11) or CNPJ (14) length */
function normalizeCpfCnpj(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[.\-\/\s]/g, "");
  if (digits.length !== 11 && digits.length !== 14) return null;
  if (/^0+$/.test(digits)) return null;
  return digits;
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
    log("Function started");

    const sandboxKey = Deno.env.get("ASAAS_SANDBOX_KEY");
    const mainKey = Deno.env.get("ASAAS_API_KEY");
    const apiKey = sandboxKey || mainKey;
    if (!apiKey) throw new Error("No Asaas API key configured");

    const ASAAS_BASE = sandboxKey
      ? "https://sandbox.asaas.com/api/v3"
      : mainKey?.startsWith("$aact_")
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/api/v3";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const user = userData.user;
    log("User authenticated", { userId: user.id, email: user.email });

    const { mesa_id, billing_type = "PIX" } = await req.json();
    if (!mesa_id) throw new Error("mesa_id is required");

    // Fetch mesa details
    const { data: mesa, error: mesaError } = await supabase
      .from("mesas")
      .select("id, title, min_price, gm_id, gm_name, seats_available, seats_total, system, format, store_id")
      .eq("id", mesa_id)
      .maybeSingle();

    if (mesaError || !mesa) throw new Error("Mesa not found");
    if (mesa.seats_available <= 0) throw new Error("Mesa is full — no seats available");
    if (mesa.min_price <= 0) throw new Error("Mesa is free — use direct booking");

    // Check if already booked
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id, status, payment_status")
      .eq("game_table_id", mesa.id)
      .eq("player_user_id", user.id)
      .in("status", ["confirmed", "completed"])
      .maybeSingle();

    if (existingBooking) throw new Error("You already have a confirmed booking for this mesa");

    // Cancel stale pending bookings
    await supabase
      .from("bookings")
      .update({ status: "canceled", payment_status: "expired" })
      .eq("game_table_id", mesa.id)
      .eq("player_user_id", user.id)
      .eq("status", "pending_payment");

    log("Stale pending bookings cleared");

    // ── CPF/CNPJ resolution cascade ──────────────────────────────────
    let { data: playerCustomer } = await supabase
      .from("asaas_customers")
      .select("asaas_id, cpf_cnpj, name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, name, cpf, mobile_phone")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: billingProfile } = await supabase
      .from("billing_profiles")
      .select("tax_document, full_name, billing_email, billing_phone")
      .eq("user_id", user.id)
      .maybeSingle();

    // 1. asaas_customers → 2. billing_profiles → 3. profiles
    const cpfCnpj =
      normalizeCpfCnpj(playerCustomer?.cpf_cnpj) ??
      normalizeCpfCnpj(billingProfile?.tax_document) ??
      normalizeCpfCnpj(profile?.cpf) ??
      null;

    log("CPF/CNPJ resolution", {
      fromCustomer: !!normalizeCpfCnpj(playerCustomer?.cpf_cnpj),
      fromBilling: !!normalizeCpfCnpj(billingProfile?.tax_document),
      fromProfile: !!normalizeCpfCnpj(profile?.cpf),
      resolved: !!cpfCnpj,
    });

    const customerName =
      billingProfile?.full_name ||
      profile?.display_name ||
      profile?.name ||
      user.user_metadata?.full_name ||
      user.email ||
      "Jogador";

    const customerEmail = billingProfile?.billing_email || user.email;
    const customerPhone = billingProfile?.billing_phone || profile?.mobile_phone || null;

    // ── If CPF/CNPJ is still missing, return structured error ────────
    if (!cpfCnpj) {
      log("BLOCKED — CPF/CNPJ missing after full cascade");
      return new Response(JSON.stringify({
        error: "missing_cpf_cnpj",
        error_code: "MISSING_CPF_CNPJ",
        message: "Para concluir o pagamento, precisamos do seu CPF ou CNPJ.",
        details: "Esse dado é exigido pela operadora de pagamento. Você só precisa preencher uma vez.",
        missing_fields: ["cpf_cnpj"],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      });
    }

    // ── Customer create / update ─────────────────────────────────────
    if (!playerCustomer?.asaas_id) {
      // Create new customer
      const createBody: Record<string, unknown> = {
        name: customerName,
        email: customerEmail,
        cpfCnpj: cpfCnpj,
        externalReference: user.id,
        notificationDisabled: true,
      };
      if (customerPhone) createBody.mobilePhone = customerPhone;

      const asaasCustRes = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "access_token": apiKey },
        body: JSON.stringify(createBody),
      });

      if (!asaasCustRes.ok) {
        const errText = await asaasCustRes.text();
        log("Asaas customer creation failed", { status: asaasCustRes.status, body: errText });
        throw new Error("Falha ao criar perfil de pagamento. Tente novamente.");
      }

      const asaasCust = await asaasCustRes.json();
      log("Asaas customer created", { asaasId: asaasCust.id });

      await supabase.from("asaas_customers").insert({
        user_id: user.id,
        asaas_id: asaasCust.id,
        name: customerName,
        email: customerEmail,
        cpf_cnpj: cpfCnpj,
        mobile_phone: customerPhone,
      });

      playerCustomer = { asaas_id: asaasCust.id, cpf_cnpj: cpfCnpj, name: customerName, email: customerEmail };
    } else if (!normalizeCpfCnpj(playerCustomer.cpf_cnpj)) {
      // Update existing customer with newly found CPF
      const updateBody: Record<string, unknown> = { cpfCnpj: cpfCnpj };
      if (customerName) updateBody.name = customerName;
      if (customerEmail) updateBody.email = customerEmail;
      if (customerPhone) updateBody.mobilePhone = customerPhone;

      const updateRes = await fetch(`${ASAAS_BASE}/customers/${playerCustomer.asaas_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "access_token": apiKey },
        body: JSON.stringify(updateBody),
      });
      if (updateRes.ok) {
        await supabase.from("asaas_customers")
          .update({ cpf_cnpj: cpfCnpj, name: customerName, email: customerEmail, mobile_phone: customerPhone })
          .eq("user_id", user.id);
        log("Updated Asaas customer CPF", { asaasId: playerCustomer.asaas_id });
      } else {
        const errText = await updateRes.text();
        log("Asaas customer update failed (non-blocking)", { status: updateRes.status, body: errText });
      }
      playerCustomer.cpf_cnpj = cpfCnpj;
    }

    // ── Create pending booking ───────────────────────────────────────
    const amount = mesa.min_price;
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        game_table_id: mesa.id,
        player_user_id: user.id,
        gm_user_id: mesa.gm_id,
        seats_reserved: 1,
        status: "pending_payment",
        amount: Math.round(amount * 100),
        currency: "brl",
        payment_status: "pending",
        source_type: "platform",
        booked_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (bookingError) throw new Error(`Failed to create booking: ${bookingError.message}`);
    log("Pending booking created", { bookingId: booking.id });

    // ── Calculate splits ─────────────────────────────────────────────
    const platformAmount = +(amount * PLATFORM_SPLIT_PERCENT / 100).toFixed(2);

    const { data: gmAccount } = await supabase
      .from("asaas_accounts")
      .select("wallet_id, asaas_id")
      .eq("user_id", mesa.gm_id)
      .maybeSingle();

    let storeAccount: { wallet_id: string | null } | null = null;
    if (mesa.store_id) {
      const { data: sa } = await supabase
        .from("asaas_accounts")
        .select("wallet_id")
        .eq("user_id", mesa.store_id)
        .maybeSingle();
      storeAccount = sa;
    }

    let gmAmount: number;
    let storeAmount = 0;

    if (storeAccount?.wallet_id) {
      const sellerPool = amount - platformAmount;
      gmAmount = +(sellerPool * 0.5).toFixed(2);
      storeAmount = +(sellerPool - gmAmount).toFixed(2);
    } else {
      gmAmount = +(amount - platformAmount).toFixed(2);
    }

    const splitRules: { walletId: string; fixedValue: number }[] = [];
    if (gmAccount?.wallet_id) {
      splitRules.push({ walletId: gmAccount.wallet_id, fixedValue: gmAmount });
    }
    if (storeAccount?.wallet_id) {
      splitRules.push({ walletId: storeAccount.wallet_id, fixedValue: storeAmount });
    }

    log("Split calculated", { total: amount, platform: platformAmount, gm: gmAmount, store: storeAmount });

    // ── Create Asaas payment ─────────────────────────────────────────
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const asaasPayload: Record<string, unknown> = {
      customer: playerCustomer.asaas_id,
      billingType: billing_type,
      value: amount,
      dueDate,
      description: `Reserva: ${mesa.title || "Mesa RPG"} - HIVIUM`,
      externalReference: `booking:${booking.id}`,
    };

    if (splitRules.length > 0) {
      asaasPayload.split = splitRules;
    }

    const asaasRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": apiKey },
      body: JSON.stringify(asaasPayload),
    });

    if (!asaasRes.ok) {
      const errBody = await asaasRes.text();
      log("Asaas payment API error", { status: asaasRes.status, body: errBody });
      // Cancel the pending booking since payment failed
      await supabase.from("bookings")
        .update({ status: "canceled", payment_status: "failed" })
        .eq("id", booking.id);
      throw new Error("Falha ao gerar cobrança. Tente novamente em alguns instantes.");
    }

    const asaasPayment = await asaasRes.json();
    log("Asaas payment created", { asaasId: asaasPayment.id });

    // Get PIX QR code if applicable
    let pixData: { encodedImage?: string; payload?: string; expirationDate?: string } = {};
    if (billing_type === "PIX" && asaasPayment.id) {
      const pixRes = await fetch(`${ASAAS_BASE}/payments/${asaasPayment.id}/pixQrCode`, {
        headers: { "access_token": apiKey },
      });
      if (pixRes.ok) {
        pixData = await pixRes.json();
      } else {
        await pixRes.text();
      }
    }

    // Save payment record
    const splitJson = {
      platform: { percent: PLATFORM_SPLIT_PERCENT, amount: platformAmount },
      gm: { user_id: mesa.gm_id, wallet_id: gmAccount?.wallet_id, amount: gmAmount },
      ...(storeAccount?.wallet_id
        ? { store: { user_id: mesa.store_id, wallet_id: storeAccount.wallet_id, amount: storeAmount } }
        : {}),
    };

    await supabase.from("asaas_payments").insert({
      user_id: user.id,
      asaas_id: asaasPayment.id,
      booking_id: booking.id,
      mesa_id: mesa.id,
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
      external_reference: `booking:${booking.id}`,
      split_json: splitJson,
    });

    // Track cart abandonment
    await supabase.from("cart_abandonments").insert({
      player_user_id: user.id,
      player_email: user.email || null,
      player_name: profile?.display_name || profile?.name || null,
      mesa_id: mesa.id,
      mesa_title: mesa.title,
      gm_user_id: mesa.gm_id,
      booking_id: booking.id,
      amount_cents: Math.round(amount * 100),
      currency: "brl",
      status: "abandoned",
    });

    // Audit
    await supabase.from("audit_log").insert({
      event_type: "booking_checkout_initiated",
      actor_id: user.id,
      actor_email: user.email,
      target_type: "booking",
      target_id: booking.id,
      details_json: { mesa_id: mesa.id, asaas_id: asaasPayment.id, amount, billing_type },
      source: "create-booking-checkout",
    });

    log("Checkout complete", { bookingId: booking.id, asaasId: asaasPayment.id });

    return new Response(JSON.stringify({
      booking_id: booking.id,
      asaas_id: asaasPayment.id,
      status: asaasPayment.status,
      billing_type,
      invoice_url: asaasPayment.invoiceUrl || null,
      pix_qr_code: pixData.encodedImage || null,
      pix_copy_paste: pixData.payload || null,
      pix_expiration: pixData.expirationDate || null,
      due_date: dueDate,
      amount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({
      error: msg,
      error_code: "CHECKOUT_ERROR",
      message: msg,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
