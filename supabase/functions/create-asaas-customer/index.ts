import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[ASAAS-CUSTOMER] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

const ASAAS_BASE = Deno.env.get("ASAAS_API_KEY")?.startsWith("$aact_")
  ? "https://api.asaas.com/v3"
  : "https://sandbox.asaas.com/api/v3";

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

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const user = userData.user;
    log("User authenticated", { userId: user.id });

    // Check if customer already exists
    const { data: existing } = await supabase
      .from("asaas_customers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.asaas_id) {
      log("Customer already exists", { asaasId: existing.asaas_id });
      return new Response(JSON.stringify({
        already_exists: true,
        asaas_id: existing.asaas_id,
        ...existing,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, display_name, email, city, country")
      .eq("user_id", user.id)
      .maybeSingle();

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    const customerName = body.name || profile?.display_name || profile?.name || user.email?.split("@")[0] || "Cliente";
    const cpfCnpj = body.cpf_cnpj || body.cpfCnpj;

    // Create in Asaas
    const asaasPayload: Record<string, unknown> = {
      name: customerName,
      email: user.email || profile?.email,
      externalReference: `user:${user.id}`,
      notificationDisabled: body.notifications_disabled ?? false,
    };
    if (cpfCnpj) asaasPayload.cpfCnpj = cpfCnpj;
    if (body.phone) asaasPayload.phone = body.phone;
    if (body.mobile_phone || body.mobilePhone) asaasPayload.mobilePhone = body.mobile_phone || body.mobilePhone;

    log("Creating Asaas customer", { name: customerName });

    const asaasRes = await fetch(`${ASAAS_BASE}/customers`, {
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

    const asaasCustomer = await asaasRes.json();
    log("Asaas customer created", { asaasId: asaasCustomer.id });

    // Save to DB
    const { error: insertError } = await supabase.from("asaas_customers").upsert({
      user_id: user.id,
      asaas_id: asaasCustomer.id,
      name: customerName,
      email: user.email || profile?.email,
      cpf_cnpj: cpfCnpj || null,
      phone: body.phone || null,
      mobile_phone: body.mobile_phone || body.mobilePhone || null,
      notifications_disabled: body.notifications_disabled ?? false,
    }, { onConflict: "user_id" });

    if (insertError) throw new Error(`DB insert error: ${insertError.message}`);

    return new Response(JSON.stringify({
      asaas_id: asaasCustomer.id,
      name: customerName,
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
