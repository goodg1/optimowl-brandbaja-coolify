// Scaffolded OAuth start for FB/IG/Threads/LinkedIn/Google Business/X.
// Returns a "not configured" message until app credentials are set as secrets.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDER_ENV: Record<string, string[]> = {
  facebook: ["META_APP_ID", "META_APP_SECRET"],
  instagram: ["META_APP_ID", "META_APP_SECRET"],
  threads: ["META_APP_ID", "META_APP_SECRET"],
  linkedin: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  google_business: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  x: ["TWITTER_CONSUMER_KEY", "TWITTER_CONSUMER_SECRET"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { platform, brand_id } = await req.json();
    const required = PROVIDER_ENV[platform];
    if (!required) throw new Error(`Unknown platform: ${platform}`);

    const missing = required.filter(k => !Deno.env.get(k));
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({
          configured: false,
          message: `${platform} OAuth is not configured yet. Missing: ${missing.join(", ")}. Use manual posting in the meantime.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // When credentials are present, return a real auth URL here.
    return new Response(
      JSON.stringify({ configured: true, message: "OAuth flow not yet implemented in code; credentials present." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
