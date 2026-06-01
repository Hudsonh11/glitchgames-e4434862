// Glitch Games Plus — one-time monthly purchase (NOT auto-renew).
// $4.99 grants 30 days of Plus benefits.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const { returnUrl } = await req.json().catch(() => ({}));

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0
      ? customers.data[0].id
      : (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "⚡ Glitch Games Plus — 1 Month",
              description:
                "2,000 coins + 100 gems + Premium Battle Pass + Plus games + 5 exclusive perks. One-time monthly purchase (no auto-renew).",
            },
            unit_amount: 499,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${returnUrl || "https://glitchgames.lovable.app"}/rewards?plus=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl || "https://glitchgames.lovable.app"}/rewards?plus=cancelled`,
      metadata: {
        user_id: user.id,
        product: "glitch_games_plus",
      },
    });

    return json({ url: session.url, sessionId: session.id }, 200);
  } catch (error) {
    console.error("create-plus-checkout error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
