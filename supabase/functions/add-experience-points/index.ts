import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CRITICAL: Use the authenticated user's ID, ignore any userId from the body
    const userId = user.id;

    // Parse request body
    const { pointsToAdd, action } = await req.json();

    // Validate inputs
    if (typeof pointsToAdd !== "number" || pointsToAdd <= 0) {
      return new Response(
        JSON.stringify({ error: "pointsToAdd must be a positive number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit max points per call to prevent abuse
    if (pointsToAdd > 500) {
      return new Response(
        JSON.stringify({ error: "pointsToAdd exceeds maximum allowed (500)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client for the update
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current performance points
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("performance_points")
      .eq("id", userId)
      .single();

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentPoints = profile?.performance_points || 0;
    const newTotal = currentPoints + pointsToAdd;

    // Update performance points
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ performance_points: newTotal })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating points:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update points" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[XP] User ${userId}: +${pointsToAdd} XP (${action || "unknown"}). New total: ${newTotal}`);

    return new Response(
      JSON.stringify({
        success: true,
        previousPoints: currentPoints,
        pointsAdded: pointsToAdd,
        newTotal,
        action,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in add-experience-points:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
