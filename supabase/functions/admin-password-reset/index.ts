// Admin-only: trigger a secure password reset for a user account.
// Verifies the caller is an admin, looks up the target's email, sends the
// built-in recovery email and returns a one-time recovery link for the admin
// to hand over manually if email delivery is unavailable.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "***";
  const visible = name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

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
    const { username, user_id, redirect_to } = body as {
      username?: string; user_id?: string; redirect_to?: string;
    };

    // Rate limit: max 5 reset links per admin per hour.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent } = await admin
      .from("admin_audit_log")
      .select("id", { count: "exact", head: true })
      .eq("admin_id", user.id)
      .eq("action", "password_reset_link")
      .gte("created_at", since);
    if ((recent ?? 0) >= 5) {
      return json({ error: "Rate limit reached (5 reset links per hour)." }, 429);
    }

    // Resolve target user
    let targetId = user_id?.trim();
    let targetName = username?.trim() ?? "";
    if (!targetId) {
      if (!targetName) return json({ error: "Missing username" }, 400);
      const { data: profile, error } = await admin
        .from("profiles")
        .select("user_id, username")
        .ilike("username", targetName)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!profile) return json({ error: "User not found" }, 404);
      targetId = profile.user_id as string;
      targetName = profile.username as string;
    } else {
      const { data: profile } = await admin
        .from("profiles").select("username").eq("user_id", targetId).maybeSingle();
      targetName = (profile?.username as string) || targetName;
    }

    const { data: target, error: getErr } = await admin.auth.admin.getUserById(targetId!);
    if (getErr || !target?.user?.email) return json({ error: "Account has no email on file" }, 404);
    const email = target.user.email;

    // Only allow same-origin app URLs supplied by the admin panel.
    let redirectTo = redirect_to || "";
    try {
      const origin = req.headers.get("origin") || "";
      if (redirectTo && origin && !redirectTo.startsWith(origin)) redirectTo = "";
      if (!redirectTo && origin) redirectTo = `${origin}/reset-password`;
    } catch { redirectTo = ""; }

    // Generate a one-time recovery link (also usable if email delivery fails).
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (linkErr) return json({ error: linkErr.message }, 500);

    // Send the recovery email through the built-in auth mailer.
    let emailed = true;
    let emailError: string | null = null;
    const { error: sendErr } = await userClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || undefined,
    });
    if (sendErr) { emailed = false; emailError = sendErr.message; }

    await admin.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "password_reset_link",
      target_type: "user",
      target_id: targetId,
      details: { username: targetName, emailed, masked_email: maskEmail(email) },
    });

    return json({
      ok: true,
      username: targetName,
      masked_email: maskEmail(email),
      emailed,
      email_error: emailError,
      // Sensitive: shown only to the verified admin who requested it.
      recovery_link: linkData?.properties?.action_link ?? null,
      expires_in_minutes: 60,
    }, 200);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
