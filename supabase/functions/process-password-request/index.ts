import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessPasswordRequestPayload {
  requestId: string;
  action: "approve" | "reject";
  adminNotes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create client with user's token to verify they're an admin
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseUser
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Only admins can process password requests");
    }

    const { requestId, action, adminNotes }: ProcessPasswordRequestPayload = await req.json();

    console.log(`Processing password request ${requestId} with action: ${action}`);

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request details
    const { data: request, error: requestError } = await supabaseAdmin
      .from("password_change_requests")
      .select("*, profiles!password_change_requests_user_id_fkey(email, full_name)")
      .eq("id", requestId)
      .single();

    if (requestError) {
      // Try without the join if foreign key doesn't exist
      const { data: requestOnly, error: requestOnlyError } = await supabaseAdmin
        .from("password_change_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (requestOnlyError) {
        throw new Error("Request not found");
      }

      // Get user email separately
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", requestOnly.user_id)
        .single();

      if (requestOnly.status !== "pending") {
        throw new Error("Request has already been processed");
      }

      // Update the request status
      const { error: updateError } = await supabaseAdmin
        .from("password_change_requests")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          admin_notes: adminNotes || null,
        })
        .eq("id", requestId);

      if (updateError) {
        throw new Error("Failed to update request");
      }

      // If approved, send password reset email
      if (action === "approve" && profile?.email) {
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
          profile.email,
          {
            redirectTo: `${req.headers.get("origin")}/auth`,
          }
        );

        if (resetError) {
          console.error("Failed to send reset email:", resetError);
          throw new Error("Failed to send password reset email");
        }

        console.log(`Password reset email sent to ${profile.email}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: action === "approve" 
            ? "Request approved. Password reset email sent to user."
            : "Request rejected.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (request.status !== "pending") {
      throw new Error("Request has already been processed");
    }

    // Update the request status
    const { error: updateError } = await supabaseAdmin
      .from("password_change_requests")
      .update({
        status: action === "approve" ? "approved" : "rejected",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
        admin_notes: adminNotes || null,
      })
      .eq("id", requestId);

    if (updateError) {
      throw new Error("Failed to update request");
    }

    // If approved, send password reset email
    if (action === "approve") {
      const userEmail = request.profiles?.email;
      if (userEmail) {
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
          userEmail,
          {
            redirectTo: `${req.headers.get("origin")}/auth`,
          }
        );

        if (resetError) {
          console.error("Failed to send reset email:", resetError);
          throw new Error("Failed to send password reset email");
        }

        console.log(`Password reset email sent to ${userEmail}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: action === "approve" 
          ? "Request approved. Password reset email sent to user."
          : "Request rejected.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error processing password request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
