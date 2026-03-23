import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[ASAAS-WALLET] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

/**
 * Provision an Asaas customer (players) or subaccount (gm/store/brand)
 * automatically after signup/onboarding.
 * Called internally by the platform — no user-facing UI needed.
 */
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
    if (!apiKey) throw new Error("No Asaas API key configured");
    const ASAAS_BASE = "https://api.asaas.com/v3";

    const body = await req.json();
    const { user_id } = body;
    if (!user_id) throw new Error("user_id is required");

    log("Provisioning wallet", { userId: user_id });

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name, name, email, city, can_gm, can_manage_store, can_manage_brand")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!profile) throw new Error("Profile not found");

    // Get user email from auth
    const { data: authData } = await supabase.auth.admin.getUserById(user_id);
    const email = authData?.user?.email || profile.email;
    const displayName = profile.display_name || profile.name || email?.split("@")[0] || "Usuário";

    const role = profile.role || "player";
    const needsSubaccount = ["gm", "store", "brand"].includes(role) || profile.can_gm || profile.can_manage_store || profile.can_manage_brand;

    // 1. Always create Asaas Customer (for payments)
    const { data: existingCustomer } = await supabase
      .from("asaas_customers")
      .select("asaas_id")
      .eq("user_id", user_id)
      .maybeSingle();

    let customerAsaasId = existingCustomer?.asaas_id;

    if (!customerAsaasId) {
      const customerPayload = {
        name: displayName,
        email,
        externalReference: `user:${user_id}`,
        notificationDisabled: false,
      };

      const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "access_token": apiKey },
        body: JSON.stringify(customerPayload),
      });

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        customerAsaasId = customerData.id;

        await supabase.from("asaas_customers").upsert({
          user_id,
          asaas_id: customerData.id,
          name: displayName,
          email,
          notifications_disabled: false,
        }, { onConflict: "user_id" });

        log("Customer created", { asaasId: customerData.id });
      } else {
        const errBody = await customerRes.text();
        log("WARN: Failed to create customer", { status: customerRes.status, body: errBody });
      }
    }

    // 2. For GMs/Stores/Brands, also create subaccount (wallet)
    let walletResult = null;
    if (needsSubaccount) {
      const { data: existingAccount } = await supabase
        .from("asaas_accounts")
        .select("asaas_id, wallet_id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (existingAccount?.asaas_id) {
        walletResult = { asaas_id: existingAccount.asaas_id, wallet_id: existingAccount.wallet_id };
        log("Subaccount already exists", walletResult);
      } else {
        // Create a minimal subaccount (full onboarding later with CPF/CNPJ)
        const subPayload = {
          name: displayName,
          email,
          cpfCnpj: body.cpf_cnpj || null,
          incomeValue: 1000,
          companyType: null,
          mobilePhone: body.mobile_phone || null,
        };

        // Only create if we have CPF/CNPJ (required by Asaas)
        if (subPayload.cpfCnpj) {
          const subRes = await fetch(`${ASAAS_BASE}/accounts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "access_token": apiKey },
            body: JSON.stringify(subPayload),
          });

          if (subRes.ok) {
            const subData = await subRes.json();
            walletResult = { asaas_id: subData.id, wallet_id: subData.walletId };

            await supabase.from("asaas_accounts").upsert({
              user_id,
              asaas_id: subData.id,
              wallet_id: subData.walletId || null,
              account_type: "managed",
              person_type: (body.cpf_cnpj || "").replace(/\D/g, "").length > 11 ? "JURIDICA" : "FISICA",
              name: displayName,
              email,
              cpf_cnpj: body.cpf_cnpj,
              onboarding_status: "pending",
              income_value: 1000,
              capabilities_json: {},
              metadata_json: { auto_provisioned: true },
            }, { onConflict: "user_id" });

            log("Subaccount created", walletResult);
          } else {
            const errBody = await subRes.text();
            log("WARN: Failed to create subaccount", { status: subRes.status, body: errBody });
          }
        } else {
          log("Skipping subaccount (no CPF/CNPJ yet)", { userId: user_id });
        }
      }
    }

    return new Response(JSON.stringify({
      customer_asaas_id: customerAsaasId || null,
      wallet: walletResult,
      role,
    }), {
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
