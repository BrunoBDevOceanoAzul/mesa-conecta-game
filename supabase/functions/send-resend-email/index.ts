import { createClient } from "npm:@supabase/supabase-js@2";
import { render } from "npm:@react-email/render@0.0.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "HIVIUM <noreply@www.sociodotabuleiro.app.br>";

// Lazy template registry — import only when needed
async function getTemplate(templateName: string) {
  const registry: Record<string, () => Promise<any>> = {
    "booking-confirmation": () => import("../_shared/email-templates/booking-confirmation.tsx"),
    "booking-canceled": () => import("../_shared/email-templates/booking-canceled.tsx"),
    "welcome-onboarding": () => import("../_shared/email-templates/welcome-onboarding.tsx"),
    "payment-receipt": () => import("../_shared/email-templates/payment-receipt.tsx"),
    "payment-failed": () => import("../_shared/email-templates/payment-failed.tsx"),
    "subscription-welcome": () => import("../_shared/email-templates/subscription-welcome.tsx"),
    "subscription-canceled": () => import("../_shared/email-templates/subscription-canceled.tsx"),
    "new-review": () => import("../_shared/email-templates/new-review.tsx"),
    "new-booking-gm": () => import("../_shared/email-templates/new-booking-gm.tsx"),
    "refund-processed": () => import("../_shared/email-templates/refund-processed.tsx"),
  };

  const loader = registry[templateName];
  if (!loader) return null;

  const mod = await loader();
  // Templates export the component as default or as a named export matching the PascalCase name
  return mod.default || mod[Object.keys(mod).find((k) => typeof mod[k] === "function") || ""];
}

// Subject lines per template
const SUBJECTS: Record<string, string | ((data: Record<string, any>) => string)> = {
  "booking-confirmation": (d) => `Vaga confirmada: ${d.mesaTitle || "sua mesa"}`,
  "booking-canceled": (d) => `Reserva cancelada: ${d.mesaTitle || "sua mesa"}`,
  "welcome-onboarding": "Bem-vindo à HIVIUM! 🎲",
  "payment-receipt": (d) => `Recibo de pagamento: R$ ${d.amount || ""}`,
  "payment-failed": "Falha no pagamento — ação necessária",
  "subscription-welcome": "Assinatura ativada! Bem-vindo ao plano premium",
  "subscription-canceled": "Sua assinatura foi cancelada",
  "new-review": "Nova avaliação recebida ⭐",
  "new-booking-gm": (d) => `Nova reserva na sua mesa: ${d.mesaTitle || ""}`,
  "refund-processed": "Estorno processado com sucesso",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { templateName, recipientEmail, templateData = {}, idempotencyKey } = body;

    if (!templateName || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "templateName and recipientEmail are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check suppression list
    const serviceSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: suppressed } = await serviceSupabase
      .from("suppressed_emails")
      .select("id")
      .eq("email", recipientEmail)
      .maybeSingle();

    if (suppressed) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "email_suppressed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check blocklist
    const { data: blocked } = await serviceSupabase
      .from("blocklist")
      .select("id")
      .eq("block_type", "email")
      .eq("target_email", recipientEmail.toLowerCase())
      .eq("is_active", true)
      .maybeSingle();

    if (blocked) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "email_blocked" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load and render template
    const TemplateComponent = await getTemplate(templateName);
    if (!TemplateComponent) {
      return new Response(
        JSON.stringify({ error: `Template "${templateName}" not found` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await render(TemplateComponent(templateData));

    // Resolve subject
    const subjectEntry = SUBJECTS[templateName] || templateName;
    const subject = typeof subjectEntry === "function" ? subjectEntry(templateData) : subjectEntry;

    const messageId = idempotencyKey || crypto.randomUUID();

    // Idempotency check
    const { data: alreadySent } = await serviceSupabase
      .from("email_send_log")
      .select("id")
      .eq("message_id", messageId)
      .eq("status", "sent")
      .maybeSingle();

    if (alreadySent) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "already_sent", message_id: messageId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log pending
    await serviceSupabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipientEmail,
      status: "pending",
    });

    // Send via Resend
    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [recipientEmail],
        subject,
        html,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      await serviceSupabase.from("email_send_log").insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipientEmail,
        status: "failed",
        error_message: JSON.stringify(resendData).slice(0, 1000),
      });

      console.error("Resend API error", { status: resendResponse.status, data: resendData });
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: resendData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log success
    await serviceSupabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: recipientEmail,
      status: "sent",
      metadata: { resend_id: resendData.id },
    });

    return new Response(
      JSON.stringify({ success: true, message_id: messageId, resend_id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-resend-email error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
