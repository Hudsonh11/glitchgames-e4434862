// Admin-only: revoke a user's Glitch Games Plus subscription.
// Marks all active subs for the target user as 'revoked' so is_plus_active() returns false.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const { target_user_id, username } = body as { target_user_id?: string; username?: string };

    let targetId = target_user_id;
    if (!targetId && username) {
      const { data: profile } = await admin
        .from("profiles")
        .select("user_id")
        .ilike("username", username.trim())
        .maybeSingle();
      if (!profile) return json({ error: "User not found" }, 404);
      targetId = profile.user_id as string;
    }
    if (!targetId) return json({ error: "Missing target_user_id or username" }, 400);

    const nowIso = new Date().toISOString();
    const { error: updErr, count } = await admin
      .from("plus_subscriptions")
      .update(
        { status: "revoked", revoked_by: user.id, revoked_at: nowIso, expires_at: nowIso },
        { count: "exact" },
      )
      .eq("user_id", targetId)
      .eq("status", "active");
    if (updErr) {
      console.error(updErr);
      return json({ error: updErr.message }, 500);
    }

    // Also strip priority support flag so all gated benefits stop.
    await admin.from("profiles").update({ priority_support: false }).eq("user_id", targetId);

    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "revoke_plus",
      target_type: "user",
      target_id: targetId,
      details: { revoked_count: count ?? null },
    });
    await admin.from("activity_feed").insert({
      user_id: targetId,
      activity_type: "system",
      content: "Your Glitch Games Plus subscription was revoked by an admin.",
    });

    return json({ ok: true, revoked: count ?? 0 }, 200);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
