import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const { code, plan_id } = await req.json();
    if (!code) throw new Error("Coupon code is required");

    const normalizedCode = code.toUpperCase().trim();

    // Fetch coupon
    const { data: coupon, error: couponError } = await supabase
      .from("discount_coupons")
      .select("*")
      .eq("public_code", normalizedCode)
      .eq("is_active", true)
      .maybeSingle();

    if (couponError || !coupon) {
      return new Response(JSON.stringify({ valid: false, reason: "Cupom não encontrado ou inativo." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();

    // Check validity period
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return new Response(JSON.stringify({ valid: false, reason: "Este cupom ainda não está válido." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return new Response(JSON.stringify({ valid: false, reason: "Este cupom expirou." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check role eligibility
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    const rolesAllowed = coupon.applies_to_roles_json as string[] || [];
    if (rolesAllowed.length > 0 && !rolesAllowed.includes(profile?.role || "")) {
      return new Response(JSON.stringify({ valid: false, reason: "Este cupom não é válido para o seu perfil." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check plan eligibility
    const plansAllowed = coupon.applies_to_plan_ids_json as string[] || [];
    if (plansAllowed.length > 0 && plan_id && !plansAllowed.includes(plan_id)) {
      return new Response(JSON.stringify({ valid: false, reason: "Este cupom não é válido para este plano." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check total redemptions
    if (coupon.max_redemptions) {
      const { count } = await supabase
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id);

      if ((count || 0) >= coupon.max_redemptions) {
        return new Response(JSON.stringify({ valid: false, reason: "Este cupom atingiu o limite de uso." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check per-user redemptions
    if (coupon.max_redemptions_per_user) {
      const { count } = await supabase
        .from("coupon_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("coupon_id", coupon.id)
        .eq("user_id", userData.user.id);

      if ((count || 0) >= coupon.max_redemptions_per_user) {
        return new Response(JSON.stringify({ valid: false, reason: "Você já utilizou este cupom." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check first-time customer only
    if (coupon.first_time_customer_only) {
      const { count } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userData.user.id);

      if ((count || 0) > 0) {
        return new Response(JSON.stringify({ valid: false, reason: "Este cupom é válido apenas para novos clientes." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Coupon is valid — return details
    return new Response(JSON.stringify({
      valid: true,
      coupon: {
        id: coupon.id,
        public_code: coupon.public_code,
        discount_type: coupon.discount_type,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        currency: coupon.currency,
        duration_type: coupon.duration_type,
        duration_in_months: coupon.duration_in_months,
        stripe_promotion_code_id: coupon.stripe_promotion_code_id,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ valid: false, reason: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
