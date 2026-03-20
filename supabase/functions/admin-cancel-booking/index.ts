import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { render } from "npm:@react-email/render@0.0.12";
import { BookingCanceled } from "../_shared/email-templates/booking-canceled.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-CANCEL-BOOKING] ${step}${d}`);
};

const SENDER_DOMAIN = "notify.sociodotabuleiro.app.br";
const FROM_ADDR = `HIVIUM <noreply@${SENDER_DOMAIN}>`;

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Authenticate admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    // Verify admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .in("role", ["admin", "advisor"])
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized: admin or advisor role required");

    const { booking_id, reason, issue_refund } = await req.json();
    if (!booking_id) throw new Error("booking_id is required");

    logStep("Cancel request", { booking_id, reason, issue_refund, admin: userData.user.id });

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .maybeSingle();

    if (bookingError || !booking) throw new Error("Booking not found");
    if (booking.status === "canceled") throw new Error("Booking is already canceled");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let refundResult = null;

    // Issue Stripe refund if requested and there's a checkout session
    if (issue_refund && booking.stripe_checkout_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id);
        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

        if (paymentIntentId) {
          const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: "requested_by_customer",
          });
          refundResult = {
            refund_id: refund.id,
            amount: refund.amount,
            currency: refund.currency,
            status: refund.status,
          };
          logStep("Stripe refund created", refundResult);
        }
      } catch (refundErr) {
        logStep("Stripe refund failed", { error: (refundErr as Error).message });
        throw new Error(`Refund failed: ${(refundErr as Error).message}`);
      }
    }

    // Update booking status
    await supabase.from("bookings").update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
      payment_status: issue_refund ? "refunded" : booking.payment_status,
    }).eq("id", booking_id);

    // Restore seat on mesa
    if (booking.game_table_id) {
      const { data: mesa } = await supabase
        .from("mesas")
        .select("seats_available")
        .eq("id", booking.game_table_id)
        .maybeSingle();

      if (mesa) {
        await supabase.from("mesas")
          .update({ seats_available: (mesa.seats_available ?? 0) + (booking.seats_reserved ?? 1) })
          .eq("id", booking.game_table_id);
      }
    }

    // Audit log
    await supabase.from("audit_log").insert({
      event_type: "booking_canceled_admin",
      target_type: "booking",
      target_id: booking_id,
      actor_id: userData.user.id,
      source: "admin-cancel-booking",
      details_json: {
        reason,
        issue_refund,
        refund: refundResult,
        player_user_id: booking.player_user_id,
        mesa_id: booking.game_table_id,
      },
    });

    // Send cancellation email to player
    try {
      const { data: playerProfile } = await supabase
        .from("profiles")
        .select("email, display_name, name")
        .eq("user_id", booking.player_user_id)
        .maybeSingle();

      const { data: mesa } = booking.game_table_id
        ? await supabase.from("mesas").select("title").eq("id", booking.game_table_id).maybeSingle()
        : { data: null };

      if (playerProfile?.email) {
        const refundStr = refundResult
          ? `R$${(refundResult.amount / 100).toFixed(2).replace(".", ",")}`
          : null;

        const html = await render(BookingCanceled({
          playerName: playerProfile.display_name || playerProfile.name || "Jogador",
          mesaTitle: mesa?.title || "Mesa de RPG",
          reason: reason || "Cancelamento administrativo",
          refundAmount: refundStr,
        }));

        const messageId = crypto.randomUUID();
        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: "booking_canceled",
          recipient_email: playerProfile.email,
          status: "pending",
          metadata: { booking_id, refund: refundResult },
        });

        await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: playerProfile.email,
            from: FROM_ADDR,
            sender_domain: SENDER_DOMAIN,
            subject: `Reserva cancelada: ${mesa?.title || "Mesa de RPG"}`,
            html,
            purpose: "transactional",
            label: "booking_canceled",
            queued_at: new Date().toISOString(),
          },
        });

        logStep("Cancellation email enqueued", { email: playerProfile.email });
      }
    } catch (emailErr) {
      logStep("WARN: cancellation email failed", { error: (emailErr as Error).message });
    }

    return new Response(JSON.stringify({
      success: true,
      booking_id,
      refund: refundResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR", { error: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
