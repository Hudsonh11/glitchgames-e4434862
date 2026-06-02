// Admin-only: gift Glitch Games Plus (N months) to a user. Service-role insert,
// caller must be an admin (verified via has_role).
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

    const { target_user_id, months } = await req.json();
    if (!target_user_id) return json({ error: "Missing target_user_id" }, 400);
    const m = Math.max(1, Math.min(36, Number(months) || 1));

    // Stack from current expiry if still active, otherwise from now.
    const { data: existing } = await admin.from("plus_subscriptions")
      .select("expires_at")
      .eq("user_id", target_user_id)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const startsAt = new Date();
    const baseline = existing?.expires_at ? new Date(existing.expires_at) : startsAt;
    const expiresAt = new Date(baseline.getTime() + m * 30 * 24 * 60 * 60 * 1000);

    const { error: insertErr } = await admin.from("plus_subscriptions").insert({
      user_id: target_user_id,
      status: "active",
      source: "admin_gift",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_cents: 0,
      currency: "usd",
      granted_by: user.id,
      stripe_session_id: `gift_${user.id}_${target_user_id}_${Date.now()}`,
    });
    if (insertErr) {
      console.error(insertErr);
      return json({ error: "Insert failed" }, 500);
    }

    // Bonus currency + battle pass + cosmetics for the gift.
    const { data: profile } = await admin.from("profiles")
      .select("coins, gems").eq("user_id", target_user_id).single();
    if (profile) {
      await admin.from("profiles").update({
        coins: (profile.coins ?? 0) + 2000 * m,
        gems: (profile.gems ?? 0) + 100 * m,
        priority_support: true,
      }).eq("user_id", target_user_id);
    }
    await admin.from("battle_pass_purchases").insert({
      user_id: target_user_id,
      season: "season_1",
      status: "completed",
      amount_cents: 0,
      currency: "gbp",
      stripe_session_id: `plus_gift_${user.id}_${target_user_id}_${Date.now()}`,
    });
    await admin.from("player_titles").insert({
      user_id: target_user_id, title_id: "plus_member", equipped: false,
    });
    await admin.from("player_borders").insert({
      user_id: target_user_id, border_id: "plus_animated", equipped: false,
    });

    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "grant_plus",
      target_type: "user",
      target_id: target_user_id,
      details: { months: m, expires_at: expiresAt.toISOString() },
    });
    await admin.from("activity_feed").insert({
      user_id: target_user_id,
      activity_type: "purchase",
      content: `Was gifted ${m} month${m > 1 ? "s" : ""} of Glitch Games Plus by an admin! ⚡🎁`,
    });

    return json({ ok: true, expires_at: expiresAt.toISOString() }, 200);
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
