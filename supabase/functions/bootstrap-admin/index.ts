import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Create admin user
  const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: "bruno@sociodotabuleiro.app.br",
    password: "Amor131313@",
    email_confirm: true,
    user_metadata: { name: "Bruno (Admin)" },
  });

  if (userError) {
    return new Response(JSON.stringify({ error: userError.message }), { status: 400 });
  }

  // Insert admin role (bypasses RLS with service role)
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: user.user.id, role: "admin" });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ success: true, user_id: user.user.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
