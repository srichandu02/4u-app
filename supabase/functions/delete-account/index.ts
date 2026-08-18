// supabase/functions/delete-account/index.ts
//
// Deploy with: supabase functions deploy delete-account
// Requires the SUPABASE_SERVICE_ROLE_KEY env var to be set on the function
// (Project Settings → Edge Functions → delete-account → Secrets) —
// NEVER expose the service role key in client code.
//
// This deletes the user's auth account, which cascades to delete their
// profile, messages, matches, etc. via the `on delete cascade` foreign
// keys already defined in schema.sql.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401 });
  }

  // Client for verifying who's calling (uses their own token, not service role)
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_ANON_KEY"),
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401 });
  }

  // Admin client for the actual deletion (service role — bypasses RLS)
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
