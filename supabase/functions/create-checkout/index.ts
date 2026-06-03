import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { season: requestedSeason, returnUrl } = await req.json();

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Compute the active season dynamically so the Stripe line-item name
    // always reflects the CURRENT battle pass (not a hardcoded "Season 1").
    const EPOCH = Date.UTC(2026, 0, 1);
    const SEASON_MS = 30 * 24 * 60 * 60 * 1000;
    const SEASON_NAMES = [
      'Neon Legends', 'Glitch Storm', 'Pixel Awakening', 'Arcade Renaissance',
      'Cyber Dynasty', 'Quantum Rush', 'Retro Future', 'Crystal Vanguard',
      'Plasma Surge', 'Echo Reborn', 'Nova Reign', 'Holo Revolution',
    ];
    const idx = Math.max(0, Math.floor((Date.now() - EPOCH) / SEASON_MS));
    const currentKey = `season_${idx + 1}`;
    const currentName = SEASON_NAMES[idx % SEASON_NAMES.length];
    const season = requestedSeason || currentKey;

    const { data: existing } = await supabaseClient
      .from("battle_pass_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("season", season)
      .eq("status", "completed")
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "Already purchased" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `🔥 Premium Battle Pass — Season ${idx + 1}: ${currentName}`,
              description:
                "Unlock exclusive rewards, premium cosmetics, bonus XP, and more!",
              images: [],
            },
            unit_amount: 499,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${returnUrl || "https://glitchgames.lovable.app"}/rewards?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl || "https://glitchgames.lovable.app"}/rewards?purchase=cancelled`,
      metadata: {
        user_id: user.id,
        season,
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});