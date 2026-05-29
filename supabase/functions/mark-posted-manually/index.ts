import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
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

  try {
    const { attempt_id, external_url } = await req.json();
    if (!attempt_id) throw new Error("attempt_id required");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
      .from("post_platform_attempts")
      .update({
        status: "published",
        posted_manually: true,
        external_url: external_url ?? null,
        published_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", attempt_id);
    if (error) throw error;

    // If all attempts published, update post
    const { data: attempt } = await supabase
      .from("post_platform_attempts")
      .select("post_id")
      .eq("id", attempt_id)
      .single();
    if (attempt) {
      const { data: all } = await supabase
        .from("post_platform_attempts")
        .select("status")
        .eq("post_id", attempt.post_id);
      if (all && all.length > 0 && all.every(a => a.status === "published")) {
        await supabase
          .from("posts")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", attempt.post_id);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
