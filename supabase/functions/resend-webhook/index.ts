import { createClient } from "npm:@supabase/supabase-js@2";
import { Webhook } from "npm:svix@1.15.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, svix-id, svix-timestamp, svix-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("RESEND_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response(
        JSON.stringify({ error: "Missing webhook signature headers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const wh = new Webhook(webhookSecret);
    let payload: any;
    try {
      payload = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const eventType = payload.type;
    const data = payload.data;

    console.log("Resend webhook event:", eventType, data?.email_id);

    switch (eventType) {
      case "email.delivered": {
        // Log delivery confirmation
        if (data?.email_id) {
          await supabase.from("email_send_log").insert({
            message_id: data.email_id,
            template_name: "resend_webhook",
            recipient_email: data.to?.[0] || "unknown",
            status: "sent",
            metadata: { event: "delivered", resend_data: data },
          });
        }
        break;
      }

      case "email.bounced": {
        const bouncedEmail = data?.to?.[0];
        if (bouncedEmail) {
          // Add to suppression list
          await supabase.from("suppressed_emails").upsert(
            {
              email: bouncedEmail,
              reason: "bounce",
              source: "resend_webhook",
              suppressed_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );

          await supabase.from("email_send_log").insert({
            message_id: data.email_id || crypto.randomUUID(),
            template_name: "resend_webhook",
            recipient_email: bouncedEmail,
            status: "bounced",
            error_message: `Bounce: ${data.bounce?.type || "unknown"}`,
          });
        }
        break;
      }

      case "email.complained": {
        const complainedEmail = data?.to?.[0];
        if (complainedEmail) {
          await supabase.from("suppressed_emails").upsert(
            {
              email: complainedEmail,
              reason: "complaint",
              source: "resend_webhook",
              suppressed_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );

          await supabase.from("email_send_log").insert({
            message_id: data.email_id || crypto.randomUUID(),
            template_name: "resend_webhook",
            recipient_email: complainedEmail,
            status: "complained",
            error_message: "Spam complaint received",
          });
        }
        break;
      }

      default:
        console.log("Unhandled Resend webhook event:", eventType);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("resend-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
