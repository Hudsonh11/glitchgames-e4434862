// Verifies a Stripe checkout session for Glitch Games Plus, then grants:
//   - 30 days of Plus
//   - 2,000 coins + 100 gems
//   - Premium Battle Pass for current season
// Idempotent via UNIQUE(stripe_session_id) on plus_subscriptions.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
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

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.session_id || "").trim();
    if (!sessionId.startsWith("cs_")) return json({ error: "Invalid session_id" }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const paid = session.payment_status === "paid";
    const sessionUserId = session.metadata?.user_id;
    const product = session.metadata?.product;
    if (!paid || sessionUserId !== user.id || product !== "glitch_games_plus") {
      return json({ ok: false, paid, reason: "not_paid_or_mismatched" }, 200);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { error: insertErr } = await admin.from("plus_subscriptions").insert({
      user_id: user.id,
      status: "active",
      source: "purchase",
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      amount_cents: session.amount_total ?? 499,
      currency: session.currency ?? "usd",
      stripe_session_id: session.id,
      stripe_payment_id: (session.payment_intent as string) || null,
    });

    if (insertErr && (insertErr as { code?: string }).code !== "23505") {
      console.error("plus insert failed", insertErr);
      return json({ error: "Failed to record" }, 500);
    }

    // Only grant currency / battle pass on the first insert.
    if (!insertErr) {
      const { data: profile } = await admin.from("profiles")
        .select("coins, gems").eq("user_id", user.id).single();
      if (profile) {
        await admin.from("profiles").update({
          coins: (profile.coins ?? 0) + 2000,
          gems: (profile.gems ?? 0) + 100,
        }).eq("user_id", user.id);
      }

      // Grant battle pass for current season (idempotent on unique session id).
      await admin.from("battle_pass_purchases").insert({
        user_id: user.id,
        season: "season_1",
        status: "completed",
        amount_cents: 0,
        currency: "usd",
        stripe_session_id: `plus_${session.id}`,
      });

      await admin.from("activity_feed").insert({
        user_id: user.id,
        activity_type: "purchase",
        content: "Joined Glitch Games Plus! ⚡",
      });
    }

    return json({ ok: true, expires_at: expiresAt.toISOString() }, 200);
  } catch (err) {
    console.error("verify-plus-purchase error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
