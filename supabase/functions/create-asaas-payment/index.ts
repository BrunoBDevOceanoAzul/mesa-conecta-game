import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[ASAAS-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

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
      billing_type = "PIX",
      amount,
      description,
      due_date,
      booking_id,
      mesa_id,
      billing_product_id,
      external_reference,
      split,           // Array of split rules [{walletId, fixedValue?, percentualValue?}]
      discount,
      fine,
      interest,
    } = body;

    if (!amount || amount <= 0) throw new Error("Amount must be greater than 0");

    log("Creating payment", { userId: user.id, amount, billingType: billing_type });

    // Ensure customer exists
    const { data: customer } = await supabase
      .from("asaas_customers")
      .select("asaas_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!customer?.asaas_id) {
      throw new Error("Asaas customer not found. Please register first.");
    }

    // Build Asaas payload
    const dueDate = due_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const asaasPayload: Record<string, unknown> = {
      customer: customer.asaas_id,
      billingType: billing_type,
      value: amount,
      dueDate,
      description: description || "Pagamento HIVIUM",
      externalReference: external_reference || (booking_id ? `booking:${booking_id}` : `user:${user.id}`),
    };

    if (split?.length) asaasPayload.split = split;
    if (discount) asaasPayload.discount = discount;
    if (fine) asaasPayload.fine = fine;
    if (interest) asaasPayload.interest = interest;

    // Create payment in Asaas
    const asaasRes = await fetch(`${ASAAS_BASE}/payments`, {
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
      }
    }

    // Save to DB
    await supabase.from("asaas_payments").insert({
      user_id: user.id,
      asaas_id: asaasPayment.id,
      billing_product_id: billing_product_id || null,
      booking_id: booking_id || null,
      mesa_id: mesa_id || null,
      billing_type: billing_type,
      amount_cents: Math.round(amount * 100),
      net_amount_cents: asaasPayment.netValue ? Math.round(asaasPayment.netValue * 100) : null,
      currency: "BRL",
      status: asaasPayment.status || "PENDING",
      due_date: dueDate,
      invoice_url: asaasPayment.invoiceUrl || null,
      bank_slip_url: asaasPayment.bankSlipUrl || null,
      pix_qr_code: pixData.encodedImage || null,
      pix_copy_paste: pixData.payload || null,
      description: description || null,
      external_reference: asaasPayload.externalReference as string,
      split_json: split || [],
      metadata_json: { pix_expiration: pixData.expirationDate },
    });

    return new Response(JSON.stringify({
      asaas_id: asaasPayment.id,
      status: asaasPayment.status,
      invoice_url: asaasPayment.invoiceUrl,
      bank_slip_url: asaasPayment.bankSlipUrl,
      pix_qr_code: pixData.encodedImage || null,
      pix_copy_paste: pixData.payload || null,
      pix_expiration: pixData.expirationDate || null,
      due_date: dueDate,
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
