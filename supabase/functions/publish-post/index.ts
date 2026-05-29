import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stub publishers — return needs_manual until real OAuth credentials are provisioned.
// Each publisher returns { externalPostId, externalUrl } on success or throws.
type Publisher = (args: {
  account: any;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
}) => Promise<{ externalPostId: string; externalUrl: string }>;

const NOT_CONFIGURED: Publisher = async () => {
  throw new Error("NOT_CONFIGURED");
};

const publishers: Record<string, Publisher> = {
  facebook: NOT_CONFIGURED,
  instagram: NOT_CONFIGURED,
  threads: NOT_CONFIGURED,
  linkedin: NOT_CONFIGURED,
  google_business: NOT_CONFIGURED,
  x: NOT_CONFIGURED,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { attempt_id } = await req.json();
    if (!attempt_id) throw new Error("attempt_id required");

    const { data: attempt, error } = await supabase
      .from("post_platform_attempts")
      .select("*, posts!inner(*)")
      .eq("id", attempt_id)
      .single();
    if (error || !attempt) throw new Error("Attempt not found");

    await supabase
      .from("post_platform_attempts")
      .update({ status: "processing", attempt_count: (attempt.attempt_count ?? 0) + 1 })
      .eq("id", attempt_id);

    const { data: account } = await supabase
      .from("brand_accounts")
      .select("*")
      .eq("brand_id", attempt.posts.brand_id)
      .eq("platform", attempt.platform)
      .maybeSingle();

    const content = attempt.content_override ?? attempt.posts.content;
    const hashtags = attempt.hashtags_override ?? attempt.posts.hashtags ?? [];
    const mediaUrls = attempt.posts.media_urls ?? [];

    const publisher = publishers[attempt.platform];
    try {
      const result = await publisher({ account, content, hashtags, mediaUrls });
      await supabase
        .from("post_platform_attempts")
        .update({
          status: "published",
          external_post_id: result.externalPostId,
          external_url: result.externalUrl,
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", attempt_id);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = msg === "NOT_CONFIGURED" ? "needs_manual" : "failed";
      await supabase
        .from("post_platform_attempts")
        .update({ status, last_error: msg })
        .eq("id", attempt_id);

      // Notify creator
      if (status === "needs_manual" && attempt.posts.created_by) {
        await supabase.from("notifications").insert({
          user_id: attempt.posts.created_by,
          type: "needs_manual_post",
          post_id: attempt.post_id,
          brand_id: attempt.posts.brand_id,
          message: `Your post needs manual posting on ${attempt.platform.replace("_", " ")}.`,
        });
      }
      return new Response(JSON.stringify({ ok: false, status, error: msg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
