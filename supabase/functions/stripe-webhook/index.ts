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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // For development without webhook secret, parse the event directly
      event = JSON.parse(body);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const season = session.metadata?.season || "season_1";

      if (userId) {
        // Record the purchase
        const { error: insertError } = await supabase
          .from("battle_pass_purchases")
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent as string,
            season,
            amount_cents: session.amount_total || 499,
            currency: session.currency || "usd",
            status: "completed",
          });

        if (insertError) {
          console.error("Failed to record purchase:", insertError);
        } else {
          // Grant bonus rewards: +1000 coins, +50 gems
          const { data: profile } = await supabase
            .from("profiles")
            .select("coins, gems")
            .eq("user_id", userId)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({
                coins: profile.coins + 1000,
                gems: profile.gems + 50,
              })
              .eq("user_id", userId);
          }

          // Log activity
          await supabase.from("activity_feed").insert({
            user_id: userId,
            activity_type: "purchase",
            content: "Unlocked the Premium Battle Pass! 🔥",
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});