import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-CREATE-STORE-USER] ${step}${d}`);
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
    logStep("Function started");

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) throw new Error("Only admins can create store users");

    logStep("Admin verified", { adminId: userData.user.id });

    const body = await req.json();
    const {
      email, password, store_name, slug, address, city, state,
      lat, lng, capacity, simultaneous_tables, phone, website,
      instagram, cnpj, ecommerce_url, description, google_place_id,
    } = body;

    if (!email || !password || !store_name) {
      throw new Error("email, password and store_name are required");
    }

    // 1. Create auth user with role=store
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: store_name,
        role: "store",
        can_manage_store: true,
      },
    });

    if (createError) throw new Error(`Failed to create user: ${createError.message}`);
    const userId = newUser.user.id;
    logStep("User created", { userId });

    // 2. Ensure profile exists with role=store
    await supabase.from("profiles").upsert({
      user_id: userId,
      email,
      name: store_name,
      role: "store",
      can_manage_store: true,
      is_active: true,
      onboarding_completed: true,
      onboarding_step: 99,
      city: city || null,
    } as any, { onConflict: "user_id" });

    logStep("Profile upserted");

    // 3. Create store record with id = userId for FK consistency
    const autoSlug = slug?.trim() || store_name.trim().toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const { data: store, error: storeError } = await supabase.from("stores").insert({
      id: userId, // Match store.id to user.id for mesa store_id FK
      name: store_name.trim(),
      slug: autoSlug,
      owner_id: userId,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      lat: lat || null,
      lng: lng || null,
      capacity: capacity || 20,
      simultaneous_tables: simultaneous_tables || 4,
      phone: phone?.trim() || null,
      website: website?.trim() || null,
      instagram: instagram?.trim() || null,
      cnpj: cnpj?.trim() || null,
      ecommerce_url: ecommerce_url?.trim() || null,
      description: description?.trim() || null,
      google_place_id: google_place_id?.trim() || null,
    }).select("id").single();

    if (storeError) throw new Error(`Failed to create store: ${storeError.message}`);
    logStep("Store created", { storeId: store.id });

    // 4. Log admin action
    await supabase.from("admin_actions").insert({
      admin_user_id: userData.user.id,
      action_type: "create_store_user",
      target_id: userId,
      target_type: "store",
      notes: `Created store "${store_name}" with user ${email}`,
      payload_json: { store_id: store.id, email },
    } as any);

    return new Response(JSON.stringify({
      user_id: userId,
      store_id: store.id,
      email,
      slug: autoSlug,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
