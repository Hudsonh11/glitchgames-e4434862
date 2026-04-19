// Admin-only: revoke Battle Pass(es). Either for a single user (by username)
// or for ALL users in a season. Uses service role; verifies caller is admin.
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
    const { username, all, season } = body as { username?: string; all?: boolean; season?: string };
    const seasonId = season || "season_1";

    let targetUserIds: string[] = [];
    let scope: "user" | "all" = "user";

    if (all === true) {
      scope = "all";
      const { data: rows, error } = await admin
        .from("battle_pass_purchases")
        .select("user_id")
        .eq("season", seasonId)
        .eq("status", "completed");
      if (error) return json({ error: error.message }, 500);
      targetUserIds = Array.from(new Set((rows || []).map((r) => r.user_id as string)));
    } else {
      if (!username || !username.trim()) return json({ error: "Missing username" }, 400);
      const { data: profile, error } = await admin
        .from("profiles")
        .select("user_id, username")
        .ilike("username", username.trim())
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!profile) return json({ error: "User not found" }, 404);
      targetUserIds = [profile.user_id as string];
    }

    if (targetUserIds.length === 0) {
      return json({ ok: true, revoked: 0, scope }, 200);
    }

    // Delete completed purchases for the season for these users.
    const { error: delErr, count } = await admin
      .from("battle_pass_purchases")
      .delete({ count: "exact" })
      .eq("season", seasonId)
      .in("user_id", targetUserIds);
    if (delErr) return json({ error: delErr.message }, 500);

    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      action: scope === "all" ? "reset_all_battle_pass" : "revoke_battle_pass",
      target_type: scope === "all" ? "season" : "user",
      target_id: scope === "all" ? seasonId : targetUserIds[0],
      details: { season: seasonId, affected: targetUserIds.length, deleted_rows: count ?? null },
    });

    return json({ ok: true, revoked: count ?? targetUserIds.length, scope, season: seasonId }, 200);
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
