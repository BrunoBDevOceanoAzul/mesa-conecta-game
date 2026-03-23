import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ASAAS-WEBHOOK] ${step}${d}`);
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
    // Validate webhook auth token (accept common Asaas header variants)
    const webhookToken = Deno.env.get("ASAAS_WEBHOOK_AUTH_TOKEN");
    const incomingToken =
      req.headers.get("asaas-access-token") ||
      req.headers.get("access_token") ||
      req.headers.get("access-token") ||
      req.headers.get("x-asaas-access-token") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
      null;

    if (!webhookToken || incomingToken !== webhookToken) {
      log("AUTH FAILED", {
        hasToken: !!incomingToken,
        hasConfigToken: !!webhookToken,
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { event, payment, subscription } = body;

    if (!event) {
      return new Response(JSON.stringify({ error: "Missing event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Event received", { event });

    // Build a unique event ID for idempotency
    const entityId = payment?.id || subscription?.id || "unknown";
    const eventId = `${event}_${entityId}_${body.dateCreated || Date.now()}`;

    // Check idempotency
    const { data: existing } = await supabase
      .from("asaas_webhook_events")
      .select("id, status")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existing?.status === "processed") {
      log("Duplicate event, skipping", { eventId });
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert or update the webhook event log
    await supabase.from("asaas_webhook_events").upsert({
      event_id: eventId,
      event_type: event,
      payload_json: body,
      status: "received",
    }, { onConflict: "event_id" });

    // Route to handler
    try {
      if (event.startsWith("PAYMENT_")) {
        await handlePaymentEvent(supabase, event, payment);
      } else if (event.startsWith("SUBSCRIPTION_")) {
        await handleSubscriptionEvent(supabase, event, subscription);
      } else {
        log("Unhandled event type", { event });
      }

      // Mark as processed
      await supabase
        .from("asaas_webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString() })
        .eq("event_id", eventId);

      log("Event processed successfully", { eventId });
    } catch (handlerError) {
      const msg = handlerError instanceof Error ? handlerError.message : String(handlerError);
      await supabase
        .from("asaas_webhook_events")
        .update({ status: "failed", error_message: msg })
        .eq("event_id", eventId);
      throw handlerError;
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Payment Event Handler ───
async function handlePaymentEvent(supabase: any, event: string, payment: any) {
  if (!payment?.id) throw new Error("Missing payment.id");

  log("Processing payment event", { event, paymentId: payment.id, status: payment.status });

  const statusMap: Record<string, string> = {
    PAYMENT_CREATED: "PENDING",
    PAYMENT_UPDATED: payment.status || "PENDING",
    PAYMENT_CONFIRMED: "CONFIRMED",
    PAYMENT_RECEIVED: "RECEIVED",
    PAYMENT_OVERDUE: "OVERDUE",
    PAYMENT_REFUNDED: "REFUNDED",
    PAYMENT_DELETED: "DELETED",
    PAYMENT_RESTORED: "RESTORED",
    PAYMENT_REFUND_IN_PROGRESS: "REFUND_IN_PROGRESS",
    PAYMENT_CHARGEBACK_REQUESTED: "CHARGEBACK_REQUESTED",
    PAYMENT_CHARGEBACK_DISPUTE: "CHARGEBACK_DISPUTE",
    PAYMENT_AWAITING_CHARGEBACK_REVERSAL: "AWAITING_CHARGEBACK_REVERSAL",
  };

  const mappedStatus = statusMap[event] || payment.status || "UNKNOWN";

  // Find the user via external reference or asaas customer
  let userId: string | null = null;

  if (payment.externalReference) {
    // externalReference format: "user:{userId}" or "booking:{bookingId}"
    const parts = payment.externalReference.split(":");
    if (parts[0] === "user") {
      userId = parts[1];
    } else if (parts[0] === "booking") {
      const { data: booking } = await supabase
        .from("bookings")
        .select("player_user_id")
        .eq("id", parts[1])
        .maybeSingle();
      userId = booking?.player_user_id || null;
    }
  }

  if (!userId && payment.customer) {
    const { data: customer } = await supabase
      .from("asaas_customers")
      .select("user_id")
      .eq("asaas_id", payment.customer)
      .maybeSingle();
    userId = customer?.user_id || null;
  }

  if (!userId) {
    log("WARN: Could not resolve user for payment", { paymentId: payment.id });
    return;
  }

  // Upsert payment record
  const paymentData: Record<string, unknown> = {
    user_id: userId,
    asaas_id: payment.id,
    billing_type: payment.billingType || "PIX",
    amount_cents: Math.round((payment.value || 0) * 100),
    net_amount_cents: payment.netValue ? Math.round(payment.netValue * 100) : null,
    currency: "BRL",
    status: mappedStatus,
    due_date: payment.dueDate || null,
    payment_date: payment.paymentDate || null,
    invoice_url: payment.invoiceUrl || null,
    bank_slip_url: payment.bankSlipUrl || null,
    description: payment.description || null,
    external_reference: payment.externalReference || null,
    asaas_subscription_id: payment.subscription || null,
    metadata_json: {
      original_event: event,
      confirmed_date: payment.confirmedDate,
      credit_date: payment.creditDate,
    },
  };

  if (["CONFIRMED", "RECEIVED"].includes(mappedStatus)) {
    paymentData.paid_at = payment.confirmedDate || payment.paymentDate || new Date().toISOString();
  }
  if (mappedStatus === "REFUNDED") {
    paymentData.refunded_at = new Date().toISOString();
  }

  const { error: upsertError } = await supabase
    .from("asaas_payments")
    .upsert(paymentData, { onConflict: "asaas_id" });

  if (upsertError) {
    log("ERROR upserting payment", { error: upsertError.message });
    throw upsertError;
  }

  // If payment is for a booking, update booking status
  if (payment.externalReference?.startsWith("booking:")) {
    const bookingId = payment.externalReference.split(":")[1];
    if (["CONFIRMED", "RECEIVED"].includes(mappedStatus)) {
      await supabase
        .from("bookings")
        .update({ payment_status: "paid", status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", bookingId);
      log("Booking confirmed via payment", { bookingId });
    } else if (mappedStatus === "REFUNDED") {
      await supabase
        .from("bookings")
        .update({ payment_status: "refunded", status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", bookingId);
      log("Booking refunded", { bookingId });
    }
  }

  log("Payment upserted", { asaasId: payment.id, status: mappedStatus });
}

// ─── Subscription Event Handler ───
async function handleSubscriptionEvent(supabase: any, event: string, subscription: any) {
  if (!subscription?.id) throw new Error("Missing subscription.id");

  log("Processing subscription event", { event, subscriptionId: subscription.id });

  const statusMap: Record<string, string> = {
    SUBSCRIPTION_CREATED: "ACTIVE",
    SUBSCRIPTION_UPDATED: subscription.status || "ACTIVE",
    SUBSCRIPTION_INACTIVATED: "INACTIVE",
    SUBSCRIPTION_DELETED: "DELETED",
  };

  const mappedStatus = statusMap[event] || subscription.status || "UNKNOWN";

  // Resolve user
  let userId: string | null = null;

  if (subscription.externalReference) {
    const parts = subscription.externalReference.split(":");
    if (parts[0] === "user") userId = parts[1];
  }

  if (!userId && subscription.customer) {
    const { data: customer } = await supabase
      .from("asaas_customers")
      .select("user_id")
      .eq("asaas_id", subscription.customer)
      .maybeSingle();
    userId = customer?.user_id || null;
  }

  if (!userId) {
    log("WARN: Could not resolve user for subscription", { subscriptionId: subscription.id });
    return;
  }

  const subData: Record<string, unknown> = {
    user_id: userId,
    asaas_id: subscription.id,
    billing_type: subscription.billingType || "CREDIT_CARD",
    cycle: subscription.cycle || "MONTHLY",
    amount_cents: Math.round((subscription.value || 0) * 100),
    currency: "BRL",
    status: mappedStatus,
    next_due_date: subscription.nextDueDate || null,
    description: subscription.description || null,
    external_reference: subscription.externalReference || null,
    split_json: subscription.split || [],
    discount_json: subscription.discount || null,
    fine_json: subscription.fine || null,
    interest_json: subscription.interest || null,
    end_date: subscription.endDate || null,
    max_payments: subscription.maxPayments || null,
    metadata_json: {
      original_event: event,
      date_created: subscription.dateCreated,
    },
  };

  if (["INACTIVE", "DELETED"].includes(mappedStatus)) {
    subData.canceled_at = new Date().toISOString();
  }

  const { error: upsertError } = await supabase
    .from("asaas_subscriptions")
    .upsert(subData, { onConflict: "asaas_id" });

  if (upsertError) {
    log("ERROR upserting subscription", { error: upsertError.message });
    throw upsertError;
  }

  // Also sync to the legacy subscriptions table for backward compat
  if (["ACTIVE", "INACTIVE", "DELETED"].includes(mappedStatus)) {
    const legacyStatus = mappedStatus === "ACTIVE" ? "active" : "canceled";

    // Find matching billing product to get plan info
    let planId: string | null = null;
    let planName = subscription.description || "Assinatura Asaas";
    let planRole = "";

    if (subscription.externalReference) {
      const refParts = subscription.externalReference.split(":");
      if (refParts[0] === "plan") {
        const { data: product } = await supabase
          .from("billing_products")
          .select("id, name, target_role")
          .eq("code", refParts[1])
          .maybeSingle();
        if (product) {
          planId = product.id;
          planName = product.name;
          planRole = product.target_role || "";
        }
      }
    }

    // Upsert into legacy subscriptions table
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSub) {
      await supabase
        .from("subscriptions")
        .update({
          status: legacyStatus,
          plan_name: planName,
          plan_role: planRole,
          price_cents: Math.round((subscription.value || 0) * 100),
          ...(mappedStatus !== "ACTIVE" ? { canceled_at: new Date().toISOString() } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSub.id);
    }
  }

  log("Subscription upserted", { asaasId: subscription.id, status: mappedStatus });
}
