import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header to verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create client with user's token to verify identity
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    console.log(`Starting account deletion for user: ${userId}`);

    // Delete from all tables in order (respecting foreign key constraints)
    const tablesToDelete = [
      { table: 'messages', conditions: [{ column: 'sender_id', value: userId }, { column: 'receiver_id', value: userId, useOr: true }] },
      { table: 'challenges', conditions: [{ column: 'challenger_id', value: userId }, { column: 'challenged_id', value: userId, useOr: true }] },
      { table: 'friendships', conditions: [{ column: 'sender_id', value: userId }, { column: 'receiver_id', value: userId, useOr: true }] },
      { table: 'activity_feed', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'game_stats', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'achievements', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'daily_rewards', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'player_titles', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'player_borders', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'player_themes', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'player_badges', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'player_status', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'ranked_stats', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'user_roles', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'bug_reports', conditions: [{ column: 'user_id', value: userId }] },
      { table: 'profiles', conditions: [{ column: 'user_id', value: userId }] },
    ];

    const errors: string[] = [];

    for (const { table, conditions } of tablesToDelete) {
      try {
        let query = supabaseAdmin.from(table).delete();
        
        if (conditions.length === 1) {
          query = query.eq(conditions[0].column, conditions[0].value);
        } else if (conditions.length === 2 && conditions[1].useOr) {
          query = query.or(`${conditions[0].column}.eq.${conditions[0].value},${conditions[1].column}.eq.${conditions[1].value}`);
        }
        
        const { error } = await query;
        
        if (error) {
          console.error(`Error deleting from ${table}:`, error.message);
          errors.push(`${table}: ${error.message}`);
        } else {
          console.log(`Successfully deleted from ${table}`);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Exception deleting from ${table}:`, errorMessage);
        errors.push(`${table}: ${errorMessage}`);
      }
    }

    // Finally, delete the auth user using admin API
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError.message);
      errors.push(`auth.users: ${deleteUserError.message}`);
    } else {
      console.log("Successfully deleted auth user");
    }

    if (errors.length > 0) {
      console.log("Deletion completed with some errors:", errors);
      // Even with some errors, if auth user is deleted, consider it a success
      if (!deleteUserError) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Account deleted successfully",
            warnings: errors 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to completely delete account", 
          details: errors 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account and all data deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
