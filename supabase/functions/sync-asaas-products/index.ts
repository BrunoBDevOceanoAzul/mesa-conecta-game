import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    // Prefer sandbox key for testing, fallback to main key
    const sandboxKey = Deno.env.get("ASAAS_SANDBOX_KEY");
    const mainKey = Deno.env.get("ASAAS_API_KEY");
    const apiKey = sandboxKey || mainKey;
    if (!apiKey) throw new Error("No Asaas API key set");

    // Sandbox key → sandbox URL, production key → production URL
    const ASAAS_BASE = sandboxKey
      ? "https://sandbox.asaas.com/api/v3"
      : (mainKey?.startsWith("$aact_") ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/api/v3");

    // Fetch all active billing products
    const { data: products, error } = await supabase
      .from("billing_products")
      .select("*")
      .eq("is_active", true)
      .eq("product_type", "subscription")
      .order("sort_order");

    if (error) throw new Error(`DB error: ${error.message}`);
    if (!products?.length) throw new Error("No products found");

    const results: { code: string; status: string; asaas_response?: unknown; error?: string }[] = [];

    for (const product of products) {
      // Skip free plans (no need to create in Asaas)
      if (product.price_cents === 0) {
        results.push({ code: product.code, status: "skipped_free" });
        continue;
      }

      const cycle = (product.billing_cycle || "monthly").toUpperCase();

      // Asaas subscription plan payload
      // Note: Asaas doesn't have a "products" endpoint like Stripe.
      // Subscriptions are created directly with the customer.
      // But we can create a "payment link" or just store config locally.
      // What we'll do is verify API connectivity and create a test customer + subscription template.

      // Actually, in Asaas the products/plans don't need to be pre-created.
      // Subscriptions are created on-the-fly with value + cycle.
      // So let's just verify API connectivity and list existing subscriptions.

      results.push({
        code: product.code,
        status: "ready",
        asaas_response: {
          name: product.name,
          value: product.price_cents / 100,
          cycle: cycle,
          description: `${product.name} - HIVIUM (${product.target_role})`,
          note: "Asaas creates subscriptions on-demand, no pre-registration needed"
        }
      });
    }

    // Verify API connectivity
    const testRes = await fetch(`${ASAAS_BASE}/finance/getCurrentBalance`, {
      headers: { "access_token": apiKey },
    });

    let apiStatus = "unknown";
    let balance = null;
    if (testRes.ok) {
      balance = await testRes.json();
      apiStatus = "connected";
    } else {
      const errText = await testRes.text();
      apiStatus = `error_${testRes.status}: ${errText}`;
    }

    // Also list existing customers to verify
    const custRes = await fetch(`${ASAAS_BASE}/customers?limit=5`, {
      headers: { "access_token": apiKey },
    });
    const customers = custRes.ok ? await custRes.json() : null;

    // List existing subscriptions
    const subRes = await fetch(`${ASAAS_BASE}/subscriptions?limit=5`, {
      headers: { "access_token": apiKey },
    });
    const subscriptions = subRes.ok ? await subRes.json() : null;

    return new Response(JSON.stringify({
      api_status: apiStatus,
      balance,
      environment: apiKey.startsWith("$aact_") ? "PRODUCTION" : "SANDBOX",
      base_url: ASAAS_BASE,
      products: results,
      existing_customers: customers?.totalCount ?? 0,
      existing_subscriptions: subscriptions?.totalCount ?? 0,
      message: "Asaas não requer pré-cadastro de produtos. Assinaturas são criadas on-demand com valor + ciclo. Todos os planos estão prontos para uso via create-asaas-subscription."
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
