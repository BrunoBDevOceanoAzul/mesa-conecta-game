import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[MANAGE-COUPONS] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
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
    // Authenticate and verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Admin access required");

    const body = await req.json();
    const { action } = body;
    logStep("Action received", { action, userId: userData.user.id });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

    // ─── CREATE COUPON ───
    if (action === "create") {
      const {
        internal_name, public_code, discount_type, percent_off, amount_off,
        currency, duration_type, duration_in_months, applies_to_roles_json,
        applies_to_plan_ids_json, applies_to_credit_packages_json,
        max_redemptions, max_redemptions_per_user, first_time_customer_only,
        minimum_amount, starts_at, expires_at, metadata_json,
      } = body;

      if (!internal_name || !public_code) throw new Error("internal_name and public_code are required");

      // Sanitize code: Stripe only allows [a-zA-Z0-9\-_]
      const sanitizedCode = public_code.toUpperCase().replace(/[^A-Z0-9\-_]/g, "");
      if (!sanitizedCode) throw new Error("Código inválido. Use apenas letras, números, - e _");

      // Create Stripe coupon
      const stripeCouponParams: Stripe.CouponCreateParams = {
        name: internal_name,
        metadata: { hivium_code: public_code, platform: "hivium" },
      };

      if (discount_type === "percent") {
        stripeCouponParams.percent_off = percent_off;
      } else {
        stripeCouponParams.amount_off = amount_off;
        stripeCouponParams.currency = (currency || "brl").toLowerCase();
      }

      if (duration_type === "repeating") {
        stripeCouponParams.duration = "repeating";
        stripeCouponParams.duration_in_months = duration_in_months || 1;
      } else if (duration_type === "forever") {
        stripeCouponParams.duration = "forever";
      } else {
        stripeCouponParams.duration = "once";
      }

      if (max_redemptions) stripeCouponParams.max_redemptions = max_redemptions;

      const stripeCoupon = await stripe.coupons.create(stripeCouponParams);
      logStep("Stripe coupon created", { couponId: stripeCoupon.id });

      // Create Stripe promotion code
      const promoParams: Stripe.PromotionCodeCreateParams = {
        coupon: stripeCoupon.id,
        code: sanitizedCode,
        active: true,
      };
      if (max_redemptions) promoParams.max_redemptions = max_redemptions;
      if (first_time_customer_only) promoParams.restrictions = { first_time_transaction: true };
      if (expires_at) promoParams.expires_at = Math.floor(new Date(expires_at).getTime() / 1000);
      if (minimum_amount) {
        promoParams.restrictions = {
          ...promoParams.restrictions,
          minimum_amount: minimum_amount,
          minimum_amount_currency: (currency || "brl").toLowerCase(),
        };
      }

      const promoCode = await stripe.promotionCodes.create(promoParams);
      logStep("Stripe promo code created", { promoId: promoCode.id });

      // Save to DB
      const { data: coupon, error: insertError } = await supabase.from("discount_coupons").insert({
        created_by_admin_user_id: userData.user.id,
        internal_name,
        public_code: sanitizedCode,
        stripe_coupon_id: stripeCoupon.id,
        stripe_promotion_code_id: promoCode.id,
        discount_type: discount_type || "percent",
        percent_off: percent_off || null,
        amount_off: amount_off || null,
        currency: currency || "BRL",
        duration_type: duration_type || "once",
        duration_in_months: duration_in_months || null,
        applies_to_roles_json: applies_to_roles_json || [],
        applies_to_plan_ids_json: applies_to_plan_ids_json || [],
        applies_to_credit_packages_json: applies_to_credit_packages_json || [],
        max_redemptions: max_redemptions || null,
        max_redemptions_per_user: max_redemptions_per_user || 1,
        first_time_customer_only: first_time_customer_only || false,
        minimum_amount: minimum_amount || null,
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        metadata_json: metadata_json || {},
        is_active: true,
      }).select().single();

      if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

      return new Response(JSON.stringify({ coupon }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── TOGGLE ACTIVE ───
    if (action === "toggle") {
      const { coupon_id, is_active } = body;
      if (!coupon_id) throw new Error("coupon_id required");

      const { data: coupon } = await supabase
        .from("discount_coupons")
        .select("stripe_promotion_code_id")
        .eq("id", coupon_id)
        .single();

      if (coupon?.stripe_promotion_code_id) {
        await stripe.promotionCodes.update(coupon.stripe_promotion_code_id, {
          active: is_active,
        });
      }

      await supabase.from("discount_coupons").update({ is_active }).eq("id", coupon_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── UPDATE COUPON ───
    if (action === "update") {
      const { coupon_id, ...updates } = body;
      if (!coupon_id) throw new Error("coupon_id required");

      const allowedFields = [
        "internal_name", "max_redemptions", "max_redemptions_per_user",
        "applies_to_roles_json", "applies_to_plan_ids_json",
        "applies_to_credit_packages_json", "expires_at", "is_active",
        "minimum_amount", "metadata_json",
      ];

      const safeUpdates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
      }

      await supabase.from("discount_coupons").update(safeUpdates).eq("id", coupon_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
