// Server-side Stripe purchase verification.
// Authenticated user posts { session_id }. We ask Stripe directly whether that
// checkout session is paid AND belongs to this user, then write a "completed"
// row using the service role. Idempotent via UNIQUE(stripe_session_id).
//
// This removes our dependency on Stripe webhooks for granting the Battle Pass,
// so the "go back / replay URL" exploit is impossible — only Stripe's API can
// say a payment succeeded.

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
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const sessionId = String(body.session_id || "").trim();
    if (!sessionId.startsWith("cs_")) {
      return json({ error: "Invalid session_id" }, 400);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Strict checks — the session must be paid AND belong to this user.
    const paid = session.payment_status === "paid";
    const sessionUserId = session.metadata?.user_id;
    if (!paid || sessionUserId !== user.id) {
      return json({ ok: false, paid, reason: "not_paid_or_mismatched_user" }, 200);
    }

    const season = session.metadata?.season || "season_1";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotent insert. UNIQUE(stripe_session_id) guarantees once-only granting.
    const { error: insertErr } = await admin.from("battle_pass_purchases").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      stripe_payment_id: (session.payment_intent as string) || null,
      season,
      amount_cents: session.amount_total ?? 499,
      currency: session.currency ?? "usd",
      status: "completed",
    });

    // 23505 = unique violation → already granted, treat as success.
    if (insertErr && (insertErr as { code?: string }).code !== "23505") {
      console.error("verify-purchase insert failed", insertErr);
      return json({ error: "Failed to record purchase" }, 500);
    }

    // Grant bonus rewards once (only if this insert was the first one).
    if (!insertErr) {
      const { data: profile } = await admin
        .from("profiles")
        .select("coins, gems")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        await admin.from("profiles").update({
          coins: profile.coins + 1000,
          gems: profile.gems + 50,
        }).eq("user_id", user.id);
      }

      await admin.from("activity_feed").insert({
        user_id: user.id,
        activity_type: "purchase",
        content: "Unlocked the Premium Battle Pass! 🔥",
      });
    }

    return json({ ok: true, granted: !insertErr }, 200);
  } catch (err) {
    console.error("verify-purchase error", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
