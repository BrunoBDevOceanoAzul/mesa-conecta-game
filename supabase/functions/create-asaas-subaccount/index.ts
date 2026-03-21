import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) =>
  console.log(`[ASAAS-SUBACCOUNT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

function getAsaasConfig() {
  const sandboxKey = Deno.env.get("ASAAS_SANDBOX_KEY");
  const mainKey = Deno.env.get("ASAAS_API_KEY");
  const apiKey = sandboxKey || mainKey;
  if (!apiKey) throw new Error("No Asaas API key configured");
  const base = sandboxKey
    ? "https://sandbox.asaas.com/api/v3"
    : (mainKey?.startsWith("$aact_") ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3");
  return { apiKey, base };
}

const ELIGIBLE_ROLES = ["gm", "store", "brand"];

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
    const { apiKey, base: ASAAS_BASE } = getAsaasConfig();

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const user = userData.user;
    log("User authenticated", { userId: user.id });

    // Check profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarding_completed, display_name, name, email, city, country")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile) throw new Error("Profile not found");
    if (!profile.onboarding_completed) throw new Error("Onboarding not completed");
    if (!ELIGIBLE_ROLES.includes(profile.role || "")) {
      throw new Error(`Role '${profile.role}' is not eligible for subaccounts`);
    }

    // Check existing
    const { data: existing } = await supabase
      .from("asaas_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.asaas_id) {
      log("Subaccount already exists", { asaasId: existing.asaas_id });
      return new Response(JSON.stringify({
        already_exists: true,
        asaas_id: existing.asaas_id,
        onboarding_status: existing.onboarding_status,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const displayName = body.name || profile.display_name || profile.name || user.email?.split("@")[0] || "Subconta";
    const cpfCnpj = body.cpf_cnpj || body.cpfCnpj;

    if (!cpfCnpj) throw new Error("CPF/CNPJ is required for subaccount creation");

    const isCompany = cpfCnpj.replace(/\D/g, "").length > 11;
    const personType = isCompany ? "JURIDICA" : "FISICA";

    // Create Asaas subaccount
    const asaasPayload: Record<string, unknown> = {
      name: displayName,
      email: user.email || profile.email,
      cpfCnpj: cpfCnpj.replace(/\D/g, ""),
      personType,
      companyType: isCompany ? (body.company_type || "LIMITED") : null,
      mobilePhone: body.mobile_phone || body.mobilePhone,
      phone: body.phone,
      incomeValue: body.income_value || 1000,
      address: body.address_line || body.address,
      addressNumber: body.address_number,
      province: body.neighborhood || body.province,
      postalCode: body.postal_code || body.postalCode,
      city: body.city || profile.city,
      state: body.state,
      country: "BR",
    };

    log("Creating Asaas subaccount", { name: displayName, personType });

    const asaasRes = await fetch(`${ASAAS_BASE}/accounts`, {
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

    const asaasAccount = await asaasRes.json();
    log("Asaas subaccount created", { asaasId: asaasAccount.id });

    // Determine status
    let onboardingStatus = "pending";
    if (asaasAccount.commercialInfoStatus === "APPROVED" &&
        asaasAccount.bankAccountInfoStatus === "APPROVED" &&
        asaasAccount.documentStatus === "APPROVED") {
      onboardingStatus = "verified";
    } else if (asaasAccount.commercialInfoStatus === "APPROVED") {
      onboardingStatus = "submitted";
    }

    // Save to DB
    await supabase.from("asaas_accounts").upsert({
      user_id: user.id,
      asaas_id: asaasAccount.id,
      wallet_id: asaasAccount.walletId || null,
      account_type: "managed",
      person_type: personType,
      company_type: isCompany ? (body.company_type || "LIMITED") : null,
      name: displayName,
      email: user.email || profile.email,
      cpf_cnpj: cpfCnpj,
      phone: body.phone || null,
      mobile_phone: body.mobile_phone || body.mobilePhone || null,
      onboarding_status: onboardingStatus,
      commercial_info_status: asaasAccount.commercialInfoStatus || "pending",
      bank_account_status: asaasAccount.bankAccountInfoStatus || "pending",
      documents_status: asaasAccount.documentStatus || "pending",
      general_status: asaasAccount.generalStatus || "pending",
      income_value: body.income_value || 1000,
      api_key: asaasAccount.apiKey || null,
      capabilities_json: {},
      metadata_json: { original_response: asaasAccount },
    }, { onConflict: "user_id" });

    // Audit log
    await supabase.from("audit_log").insert({
      event_type: "asaas_subaccount_created",
      actor_id: user.id,
      actor_email: user.email,
      target_type: "asaas_account",
      target_id: asaasAccount.id,
      details_json: { role: profile.role, status: onboardingStatus },
      source: "create-asaas-subaccount",
    });

    return new Response(JSON.stringify({
      asaas_id: asaasAccount.id,
      wallet_id: asaasAccount.walletId,
      onboarding_status: onboardingStatus,
      api_key: asaasAccount.apiKey || null,
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
