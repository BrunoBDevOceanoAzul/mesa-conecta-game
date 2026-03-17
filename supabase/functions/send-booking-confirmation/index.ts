import { createClient } from "npm:@supabase/supabase-js@2";
import { render } from "npm:@react-email/render@0.0.12";
import { BookingConfirmation } from "../_shared/email-templates/booking-confirmation.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      playerEmail,
      playerName,
      mesaTitle,
      gmName,
      system,
      date,
      time,
      venue,
      format,
      price,
      mesaId,
    } = body;

    if (!playerEmail || !mesaTitle) {
      return new Response(
        JSON.stringify({ error: "playerEmail and mesaTitle are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check suppression list
    const { data: suppressed } = await supabase
      .from("suppressed_emails")
      .select("id")
      .eq("email", playerEmail)
      .maybeSingle();

    if (suppressed) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "email_suppressed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = "https://sociodotabuleiro.app.br";
    const mesaUrl = mesaId ? `${siteUrl}/mesa/${mesaId}` : siteUrl;

    // Render the email template
    const html = await render(
      BookingConfirmation({
        playerName: playerName || "Jogador",
        mesaTitle,
        gmName: gmName || "Mestre",
        system: system || "RPG",
        date: date || "A definir",
        time: time || "A definir",
        venue: venue || "A definir",
        format: format || "Presencial",
        price: price || "Consultar",
        mesaUrl,
        siteUrl,
      })
    );

    const messageId = crypto.randomUUID();

    // Log as pending
    await supabase.from("email_send_log").insert({
      message_id: messageId,
      template_name: "booking_confirmation",
      recipient_email: playerEmail,
      status: "pending",
      metadata: { mesa_id: mesaId, mesa_title: mesaTitle },
    });

    // Enqueue to transactional queue
    const { error: enqueueError } = await supabase.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: playerEmail,
        from: "MesaNexo <noreply@notify.sociodotabuleiro.app.br>",
        sender_domain: "notify.sociodotabuleiro.app.br",
        subject: `Vaga confirmada: ${mesaTitle}`,
        html,
        purpose: "transactional",
        label: "booking_confirmation",
        queued_at: new Date().toISOString(),
      },
    });

    if (enqueueError) {
      console.error("Failed to enqueue booking email", enqueueError);
      return new Response(
        JSON.stringify({ error: "Failed to enqueue email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message_id: messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-booking-confirmation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
