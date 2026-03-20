import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { render } from "npm:@react-email/render@0.0.12";
import { BookingConfirmation } from "../_shared/email-templates/booking-confirmation.tsx";
import { NewBookingGM } from "../_shared/email-templates/new-booking-gm.tsx";
import { SubscriptionWelcome } from "../_shared/email-templates/subscription-welcome.tsx";
import { SubscriptionCanceled } from "../_shared/email-templates/subscription-canceled.tsx";
import { PaymentReceipt } from "../_shared/email-templates/payment-receipt.tsx";
import { PaymentFailed } from "../_shared/email-templates/payment-failed.tsx";
import { RefundProcessed } from "../_shared/email-templates/refund-processed.tsx";

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${d}`);
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

// ─── Idempotency Guard ─────────────────────────────────────

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  return !!data;
}

async function markProcessed(eventId: string, eventType: string, status = "processed", errorMessage?: string) {
  await supabase.from("webhook_events").upsert({
    id: eventId,
    event_type: eventType,
    status,
    error_message: errorMessage || null,
    processed_at: new Date().toISOString(),
  });
}

// ─── Audit Logger ───────────────────────────────────────────

async function auditLog(eventType: string, targetType: string, targetId: string, details: Record<string, unknown> = {}) {
  await supabase.from("audit_log").insert({
    event_type: eventType,
    target_type: targetType,
    target_id: targetId,
    details_json: details,
    source: "stripe-webhook",
  });
}

// ─── Email Helper ──────────────────────────────────────────

const SENDER_DOMAIN = "notify.sociodotabuleiro.app.br";
const FROM_ADDR = `HIVIUM <noreply@${SENDER_DOMAIN}>`;

async function enqueueTransactionalEmail(recipientEmail: string, subject: string, html: string, label: string, meta: Record<string, unknown> = {}) {
  const messageId = crypto.randomUUID();
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: label,
    recipient_email: recipientEmail,
    status: "pending",
    metadata: meta,
  });
  await supabase.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      message_id: messageId,
      to: recipientEmail,
      from: FROM_ADDR,
      sender_domain: SENDER_DOMAIN,
      subject,
      html,
      purpose: "transactional",
      label,
      queued_at: new Date().toISOString(),
    },
  });
  logStep(`Email enqueued: ${label}`, { recipientEmail, messageId });
}

// ─── Helpers ───────────────────────────────────────────────

async function resolveUserByCustomerId(customerId: string): Promise<{ user_id: string; email: string } | null> {
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const email = customer.email;
  if (!email) { logStep("No email on customer", { customerId }); return null; }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, email")
    .eq("email", email)
    .maybeSingle();

  if (!profile) { logStep("No profile for email", { email }); return null; }
  return { user_id: profile.user_id, email };
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const resolved = await resolveUserByCustomerId(customerId);
  if (!resolved) return;

  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? null;
  const productId = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id ?? null;

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .or(`stripe_price_id.eq.${priceId},stripe_product_id.eq.${productId}`)
    .limit(1)
    .maybeSingle();

  const mapStatus = (s: string) => {
    if (s === "active") return "active";
    if (s === "trialing") return "trial";
    if (s === "past_due") return "past_due";
    if (s === "canceled" || s === "unpaid" || s === "incomplete_expired") return "canceled";
    return s;
  };

  const payload: Record<string, unknown> = {
    user_id: resolved.user_id,
    status: mapStatus(sub.status),
    provider: "stripe",
    stripe_subscription_id: sub.id,
    stripe_customer_id: customerId,
    stripe_price_id: priceId,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    price_cents: item?.price?.unit_amount ?? 0,
    plan_name: plan?.name ?? "Stripe Plan",
    plan_role: plan?.role ?? "subscriber",
    plan_id: plan?.id ?? null,
  };

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", sub.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("subscriptions").update(payload).eq("id", existing.id);
    logStep("Subscription updated", { id: existing.id, status: payload.status });
    await auditLog("subscription_updated", "subscription", existing.id, { stripe_sub_id: sub.id, status: payload.status });
  } else {
    const { data: created } = await supabase.from("subscriptions").insert(payload).select("id").single();
    logStep("Subscription created", { id: created?.id });
    await auditLog("subscription_created", "subscription", created?.id || "", { stripe_sub_id: sub.id, status: payload.status });

    // Send welcome email
    try {
      const { data: profile } = await supabase.from("profiles").select("email, display_name, name, role").eq("user_id", resolved.user_id).maybeSingle();
      if (profile?.email) {
        const html = await render(SubscriptionWelcome({
          userName: profile.display_name || profile.name || "Usuário",
          planName: plan?.name || "Premium",
          role: profile.role || "player",
        }));
        await enqueueTransactionalEmail(profile.email, `Bem-vindo ao plano ${plan?.name || "Premium"}! 🏆`, html, "subscription_welcome", { sub_id: sub.id });
      }
    } catch (e) { logStep("WARN: welcome email failed", { error: (e as Error).message }); }

    // Increment founder slot counter if applicable
    if (plan?.is_founder_plan) {
      await supabase
        .from("plans")
        .update({ founder_slots_used: (plan.founder_slots_used || 0) + 1 })
        .eq("id", plan.id);
      logStep("Founder slot incremented", { plan_code: plan.code, used: (plan.founder_slots_used || 0) + 1 });
    }
  }
}

async function recordPayment(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const resolved = await resolveUserByCustomerId(customerId);
  if (!resolved) return;

  // Deduplicate by stripe_invoice_id
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_invoice_id", invoice.id)
    .maybeSingle();

  if (existingPayment) {
    logStep("Payment already recorded, skipping", { invoiceId: invoice.id });
    return;
  }

  const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id ?? null;
  let localSubId: string | null = null;
  if (subId) {
    const { data: localSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", subId)
      .maybeSingle();
    localSubId = localSub?.id ?? null;
  }

  const { data: payment } = await supabase.from("payments").insert({
    user_id: resolved.user_id,
    subscription_id: localSubId,
    amount: invoice.amount_paid ?? 0,
    currency: invoice.currency ?? "brl",
    status: invoice.status === "paid" ? "paid" : "failed",
    payment_type: "subscription",
    provider: "stripe",
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.payment_intent?.id ?? null,
    description: `Fatura Stripe: ${invoice.number ?? invoice.id}`,
    paid_at: invoice.status === "paid" ? new Date((invoice.status_transitions?.paid_at ?? Math.floor(Date.now() / 1000)) * 1000).toISOString() : null,
    external_payment_id: invoice.id,
  }).select("id").maybeSingle();

  logStep("Payment recorded", { invoiceId: invoice.id, status: invoice.status });
  await auditLog("payment_recorded", "payment", payment?.id || "", { invoice_id: invoice.id, amount: invoice.amount_paid });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logStep("Checkout completed", { sessionId: session.id, mode: session.mode });

  if (session.mode === "payment" && session.metadata?.type === "credit_purchase") {
    const creditsAmount = parseInt(session.metadata.credits_amount ?? "0", 10);
    const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (!customerId || creditsAmount <= 0) return;

    const resolved = await resolveUserByCustomerId(customerId);
    if (!resolved) return;

    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("id, balance")
      .eq("user_id", resolved.user_id)
      .maybeSingle();

    if (wallet) {
      const newBalance = (wallet.balance ?? 0) + creditsAmount;
      await supabase.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);

      await supabase.from("wallet_transactions").insert({
        user_id: resolved.user_id,
        wallet_id: wallet.id,
        amount: creditsAmount,
        transaction_type: "credit_purchase",
        description: `Compra de ${creditsAmount} créditos via Stripe`,
        balance_before: wallet.balance,
        balance_after: newBalance,
        reference_type: "checkout_session",
        reference_id: session.id,
      });

      logStep("Credits added to wallet", { userId: resolved.user_id, credits: creditsAmount });
      await auditLog("credits_purchased", "wallet", wallet.id, { credits: creditsAmount, session_id: session.id });
    }
  }

  // ─── Mesa Booking Payment ───
  if (session.mode === "payment" && session.metadata?.type === "mesa_booking") {
    const bookingId = session.metadata.hivium_booking_id;
    const mesaId = session.metadata.hivium_mesa_id;
    const userId = session.metadata.hivium_user_id;

    if (bookingId) {
      // Confirm booking
      await supabase.from("bookings").update({
        status: "confirmed",
        payment_status: "paid",
      }).eq("id", bookingId);

      // Decrement seats
      if (mesaId) {
        const { data: mesa } = await supabase
          .from("mesas")
          .select("seats_available")
          .eq("id", mesaId)
          .maybeSingle();

        if (mesa && mesa.seats_available > 0) {
          await supabase.from("mesas")
            .update({ seats_available: mesa.seats_available - 1 })
            .eq("id", mesaId);
        }
      }

      logStep("Booking confirmed after payment", { bookingId, mesaId });
      await auditLog("booking_paid", "booking", bookingId, { mesa_id: mesaId, user_id: userId, session_id: session.id });

      // Mark cart abandonment as recovered
      await supabase.from("cart_abandonments")
        .update({ status: "recovered", recovered_at: new Date().toISOString() })
        .eq("booking_id", bookingId)
        .eq("status", "abandoned");

      // ─── Send booking confirmation email ───
      try {
        // Fetch booking + mesa + player + gm details
        const { data: booking } = await supabase
          .from("bookings")
          .select("player_user_id, gm_user_id, game_table_id, amount, currency, seats_reserved")
          .eq("id", bookingId)
          .maybeSingle();

        const { data: mesa } = mesaId
          ? await supabase.from("mesas").select("title, system, format, session_date, session_time, venue, price_per_seat").eq("id", mesaId).maybeSingle()
          : { data: null };

        const playerUserId = booking?.player_user_id || userId;
        const gmUserId = booking?.gm_user_id;

        const [playerRes, gmRes] = await Promise.all([
          playerUserId ? supabase.from("profiles").select("email, name, display_name").eq("user_id", playerUserId).maybeSingle() : { data: null },
          gmUserId ? supabase.from("profiles").select("name, display_name").eq("user_id", gmUserId).maybeSingle() : { data: null },
        ]);

        const playerEmail = playerRes.data?.email || session.customer_details?.email;
        const playerName = playerRes.data?.display_name || playerRes.data?.name || "Jogador";
        const gmName = gmRes.data?.display_name || gmRes.data?.name || "Mestre";

        if (playerEmail && mesa) {
          const siteUrl = "https://sociodotabuleiro.app.br";
          const mesaUrl = mesaId ? `${siteUrl}/mesa/${mesaId}` : siteUrl;

          const priceStr = mesa.price_per_seat
            ? `R$${(mesa.price_per_seat / 100).toFixed(2).replace(".", ",")}`
            : booking?.amount
              ? `R$${(booking.amount / 100).toFixed(2).replace(".", ",")}`
              : "Consultar";

          const html = await render(
            BookingConfirmation({
              playerName,
              mesaTitle: mesa.title || "Mesa de RPG",
              gmName,
              system: mesa.system || "RPG",
              date: mesa.session_date || "A definir",
              time: mesa.session_time || "A definir",
              venue: mesa.venue || (mesa.format === "online" ? "Online" : "A definir"),
              format: mesa.format || "Presencial",
              price: priceStr,
              mesaUrl,
              siteUrl,
            })
          );

          const messageId = crypto.randomUUID();

          await supabase.from("email_send_log").insert({
            message_id: messageId,
            template_name: "booking_confirmation",
            recipient_email: playerEmail,
            status: "pending",
            metadata: { mesa_id: mesaId, booking_id: bookingId },
          });

          await supabase.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload: {
              message_id: messageId,
              to: playerEmail,
              from: "HIVIUM <noreply@notify.sociodotabuleiro.app.br>",
              sender_domain: "notify.sociodotabuleiro.app.br",
              subject: `Vaga confirmada: ${mesa.title || "Mesa de RPG"}`,
              html,
              purpose: "transactional",
              label: "booking_confirmation",
              queued_at: new Date().toISOString(),
            },
          });

          logStep("Booking confirmation email enqueued", { playerEmail, messageId });
        }

        // ─── Notify GM about new booking ───
        if (gmUserId && mesa) {
          const { data: gmProfile } = await supabase.from("profiles").select("email, display_name, name").eq("user_id", gmUserId).maybeSingle();
          if (gmProfile?.email) {
            const seatsLeft = mesa.price_per_seat ? 0 : 0; // will fetch below
            const { data: mesaFresh } = await supabase.from("mesas").select("seats_available").eq("id", mesaId!).maybeSingle();
            const gmHtml = await render(NewBookingGM({
              gmName: gmProfile.display_name || gmProfile.name || "Mestre",
              playerName,
              mesaTitle: mesa.title || "Mesa de RPG",
              date: mesa.session_date || "A definir",
              time: mesa.session_time || "A definir",
              seatsRemaining: mesaFresh?.seats_available ?? 0,
              mesaId: mesaId || "",
            }));
            await enqueueTransactionalEmail(gmProfile.email, `Nova reserva: ${playerName} em "${mesa.title}"`, gmHtml, "new_booking_gm", { mesa_id: mesaId, booking_id: bookingId });
            logStep("GM booking notification email enqueued", { gmEmail: gmProfile.email });
          }
        }
      } catch (emailErr) {
        logStep("WARN: Failed to send booking email (non-blocking)", { error: (emailErr as Error).message });
      }
    }
  }

  await auditLog("checkout_completed", "checkout_session", session.id, {
    mode: session.mode,
    type: session.metadata?.type,
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const customerId = typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  if (!customerId) return;

  const resolved = await resolveUserByCustomerId(customerId);
  if (!resolved) return;

  // Deduplicate
  const { data: existingRefund } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_charge_id", charge.id)
    .eq("payment_type", "refund")
    .maybeSingle();

  if (existingRefund) {
    logStep("Refund already recorded", { chargeId: charge.id });
    return;
  }

  await supabase.from("payments").insert({
    user_id: resolved.user_id,
    amount: -(charge.amount_refunded ?? 0),
    currency: charge.currency ?? "brl",
    status: "refunded",
    payment_type: "refund",
    provider: "stripe",
    stripe_charge_id: charge.id,
    description: `Reembolso Stripe: ${charge.id}`,
    paid_at: new Date().toISOString(),
    external_payment_id: charge.id,
  });

  logStep("Refund recorded", { chargeId: charge.id, amount: charge.amount_refunded });
  await auditLog("charge_refunded", "charge", charge.id, { amount: charge.amount_refunded });
}

// ─── Main Handler ──────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    logStep("ERROR: Missing stripe-signature header");
    return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logStep("ERROR: Signature verification failed", { error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  // ─── Idempotency check ───
  if (await isAlreadyProcessed(event.id)) {
    logStep("Event already processed, skipping", { id: event.id });
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const { data: existing } = await supabase
          .from("subscriptions")
          .select("id, plan_name, user_id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();
        if (existing) {
          await supabase.from("subscriptions").update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
          }).eq("id", existing.id);
          logStep("Subscription canceled/deleted", { id: existing.id });
          await auditLog("subscription_deleted", "subscription", existing.id, { stripe_sub_id: sub.id });

          // Send cancellation email
          try {
            const { data: profile } = await supabase.from("profiles").select("email, display_name, name").eq("user_id", existing.user_id).maybeSingle();
            if (profile?.email) {
              const endDate = new Date(sub.current_period_end * 1000).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
              const html = await render(SubscriptionCanceled({ userName: profile.display_name || profile.name || "Usuário", planName: existing.plan_name || "Premium", endDate }));
              await enqueueTransactionalEmail(profile.email, `Sua assinatura ${existing.plan_name || "Premium"} foi cancelada`, html, "subscription_canceled", { sub_id: sub.id });
            }
          } catch (e) { logStep("WARN: cancel email failed", { error: (e as Error).message }); }
        }
        break;
      }

      case "invoice.paid":
        await recordPayment(event.data.object as Stripe.Invoice);
        {
          const inv = event.data.object as Stripe.Invoice;
          const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            await upsertSubscription(sub);
          }
          // Send payment receipt email
          try {
            const custId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
            if (custId) {
              const resolved = await resolveUserByCustomerId(custId);
              if (resolved) {
                const { data: prof } = await supabase.from("profiles").select("display_name, name").eq("user_id", resolved.user_id).maybeSingle();
                const amountStr = `R$${((inv.amount_paid ?? 0) / 100).toFixed(2).replace(".", ",")}`;
                const paidDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
                const html = await render(PaymentReceipt({
                  userName: prof?.display_name || prof?.name || "Usuário",
                  amount: amountStr,
                  date: paidDate,
                  invoiceNumber: inv.number || inv.id,
                  description: `Fatura ${inv.number || inv.id}`,
                }));
                await enqueueTransactionalEmail(resolved.email, `Recibo de pagamento — ${amountStr}`, html, "payment_receipt", { invoice_id: inv.id });
              }
            }
          } catch (e) { logStep("WARN: payment receipt email failed", { error: (e as Error).message }); }
        }
        break;

      case "invoice.payment_failed":
        await recordPayment(event.data.object as Stripe.Invoice);
        {
          const inv = event.data.object as Stripe.Invoice;
          const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
          if (subId) {
            const { data: localSub } = await supabase
              .from("subscriptions")
              .select("id")
              .eq("stripe_subscription_id", subId)
              .maybeSingle();
            if (localSub) {
              await supabase.from("subscriptions").update({ status: "past_due" }).eq("id", localSub.id);
              logStep("Subscription marked past_due", { id: localSub.id });
              await auditLog("subscription_past_due", "subscription", localSub.id, {});
            }
          }
          // Send payment failed email
          try {
            const custId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
            if (custId) {
              const resolved = await resolveUserByCustomerId(custId);
              if (resolved) {
                const { data: prof } = await supabase.from("profiles").select("display_name, name").eq("user_id", resolved.user_id).maybeSingle();
                const amountStr = `R$${((inv.amount_due ?? 0) / 100).toFixed(2).replace(".", ",")}`;
                const html = await render(PaymentFailed({
                  userName: prof?.display_name || prof?.name || "Usuário",
                  amount: amountStr,
                  invoiceNumber: inv.number || inv.id,
                  nextRetryDate: new Date(Date.now() + 3 * 86400000).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
                }));
                await enqueueTransactionalEmail(resolved.email, `Falha no pagamento — ${amountStr}`, html, "payment_failed", { invoice_id: inv.id });
              }
            }
          } catch (e) { logStep("WARN: payment failed email failed", { error: (e as Error).message }); }
        }
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        // Send refund email
        try {
          const ch = event.data.object as Stripe.Charge;
          const custId = typeof ch.customer === "string" ? ch.customer : ch.customer?.id;
          if (custId) {
            const resolved = await resolveUserByCustomerId(custId);
            if (resolved) {
              const { data: prof } = await supabase.from("profiles").select("display_name, name").eq("user_id", resolved.user_id).maybeSingle();
              const refundAmountStr = `R$${((ch.amount_refunded ?? 0) / 100).toFixed(2).replace(".", ",")}`;
              const html = await render(RefundProcessed({
                userName: prof?.display_name || prof?.name || "Usuário",
                amount: refundAmountStr,
                date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
                reason: "Reembolso processado conforme solicitado.",
              }));
              await enqueueTransactionalEmail(resolved.email, `Reembolso processado — ${refundAmountStr}`, html, "refund_processed", { charge_id: ch.id });
            }
          }
        } catch (e) { logStep("WARN: refund email failed", { error: (e as Error).message }); }
        break;

      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        const acctId = acct.id;
        logStep("Connect account.updated", { accountId: acctId });

        const { data: connectedAcct } = await supabase
          .from("connected_accounts")
          .select("id")
          .eq("stripe_connected_account_id", acctId)
          .maybeSingle();

        if (connectedAcct) {
          let onboardingStatus = "pending";
          if (acct.charges_enabled && acct.payouts_enabled && acct.details_submitted) {
            onboardingStatus = "verified";
          } else if (acct.details_submitted) {
            onboardingStatus = "submitted";
          } else if (acct.requirements?.disabled_reason) {
            onboardingStatus = "restricted";
          }

          await supabase.from("connected_accounts").update({
            charges_enabled: acct.charges_enabled ?? false,
            payouts_enabled: acct.payouts_enabled ?? false,
            details_submitted: acct.details_submitted ?? false,
            onboarding_status: onboardingStatus,
            capabilities_json: acct.capabilities ?? {},
            requirements_json: acct.requirements ?? {},
          }).eq("id", connectedAcct.id);

          logStep("Connected account synced", { id: connectedAcct.id, status: onboardingStatus });
          await auditLog("connect_account_updated", "connected_account", connectedAcct.id, { status: onboardingStatus });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    await markProcessed(event.id, event.type);
  } catch (err) {
    const errorMsg = (err as Error).message;
    logStep("ERROR processing event", { type: event.type, error: errorMsg });
    await markProcessed(event.id, event.type, "error", errorMsg);
    return new Response(JSON.stringify({ error: "Processing failed" }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
