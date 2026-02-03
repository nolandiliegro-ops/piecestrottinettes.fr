import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  userId: string;
  pointsToAdd: number;
  action?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { userId, pointsToAdd, action } = (await req.json()) as RequestBody;

    // Validate inputs
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
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
