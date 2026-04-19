// Admin-only: grant a Battle Pass to a target user without any payment.
// Uses service role to bypass RLS, but verifies the caller is an admin.
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

    // Verify caller is an admin via has_role.
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { target_user_id, season } = await req.json();
    if (!target_user_id) return json({ error: "Missing target_user_id" }, 400);

    const seasonId = season || "season_1";
    const markerId = `admin_grant_${user.id}_${target_user_id}_${seasonId}`;

    const { error: insertErr } = await admin.from("battle_pass_purchases").insert({
      user_id: target_user_id,
      season: seasonId,
      status: "completed",
      amount_cents: 0,
      currency: "usd",
      stripe_session_id: markerId,
    });
    const alreadyHad = insertErr && (insertErr as { code?: string }).code === "23505";
    if (insertErr && !alreadyHad) {
      console.error(insertErr);
      return json({ error: "Insert failed" }, 500);
    }

    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "grant_battle_pass",
      target_type: "user",
      target_id: target_user_id,
      details: { season: seasonId, already_had: !!alreadyHad },
    });

    if (!alreadyHad) {
      await admin.from("activity_feed").insert({
        user_id: target_user_id,
        activity_type: "purchase",
        content: "Was granted the Premium Battle Pass by an admin! 🎁",
      });
    }

    return json({ ok: true, already_had: !!alreadyHad }, 200);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
