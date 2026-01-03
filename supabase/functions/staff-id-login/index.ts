import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { staff_number } = await req.json();

    if (!staff_number) {
      console.error('Staff ID login error: No staff number provided');
      return new Response(
        JSON.stringify({ error: 'Staff number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Staff ID login attempt with staff number:', staff_number);

    // Create admin client for authentication
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Look up user by staff number
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, full_name, email, is_approved')
      .eq('staff_number', staff_number.toUpperCase())
      .maybeSingle();

    if (profileError) {
      console.error('Staff ID login profile lookup error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify staff number' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile) {
      console.error('Staff ID login error: Invalid staff number - no profile found');
      return new Response(
        JSON.stringify({ error: 'Invalid staff number' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.is_approved) {
      console.error('Staff ID login error: User not approved:', profile.user_id);
      return new Response(
        JSON.stringify({ error: 'Your account is pending approval' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user role for redirection
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    // Generate a magic link for the user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: profile.email,
    });

    if (linkError || !linkData) {
      console.error('Staff ID login magic link error:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate login session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token hash from the magic link
    const tokenHash = linkData.properties?.hashed_token;

    if (!tokenHash) {
      console.error('Staff ID login error: No token hash in magic link response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate login token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Staff ID login successful for user:', profile.full_name);

    return new Response(
      JSON.stringify({
        success: true,
        email: profile.email,
        token_hash: tokenHash,
        type: 'magiclink',
        full_name: profile.full_name,
        user_id: profile.user_id,
        role: roleData?.role || 'staff',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Staff ID login unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
