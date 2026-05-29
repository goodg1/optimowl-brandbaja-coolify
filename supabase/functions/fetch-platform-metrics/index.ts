import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Stub: fetch external engagement metrics for a published post.
 *
 * To wire up a real provider:
 * - facebook / instagram / threads → Meta Graph API (requires page access token)
 * - linkedin → LinkedIn Marketing Developer Platform
 * - google_business → Google Business Profile API
 *
 * For now this just returns 501 so the UI can show a "connect a platform" empty state.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: claims } = await supabase.auth.getClaims(token);
  if (!claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: false,
      message:
        "External metrics integration is not yet configured. Connect a social platform to enable engagement tracking.",
    }),
    { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
