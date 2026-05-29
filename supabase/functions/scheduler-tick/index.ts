import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function ensureCronJob(supabase: ReturnType<typeof createClient>) {
  try {
    const { data: existing } = await supabase
      .from("cron.job")
      .select("jobid")
      .eq("jobname", "scheduler-tick-every-minute")
      .maybeSingle();

    if (!existing) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !serviceRoleKey) {
        console.warn("cannot auto-create cron: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        return;
      }

      const headers = JSON.stringify({
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      });

      await supabase.rpc("cron_schedule_inline", {
        job_name: "scheduler-tick-every-minute",
        schedule: "* * * * *",
        command: `SELECT net.http_post(url:='${supabaseUrl}/functions/v1/scheduler-tick', headers:='${headers}'::jsonb, body:='{}'::jsonb)`,
      });
      console.log("auto-created cron job scheduler-tick-every-minute");
    }
  } catch (e) {
    console.warn("ensureCronJob failed (non-fatal):", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  await ensureCronJob(supabase);

  // Find due scheduled posts
  const { data: duePosts, error } = await supabase
    .from("posts")
    .select("id, brand_id, content, hashtags, media_urls, platforms, scheduled_for")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  for (const post of duePosts ?? []) {
    for (const platform of (post.platforms ?? []) as string[]) {
      // Ensure attempt row exists
      const { data: existing } = await supabase
        .from("post_platform_attempts")
        .select("id, status")
        .eq("post_id", post.id)
        .eq("platform", platform)
        .maybeSingle();

      let attemptId = existing?.id as string | undefined;
      if (!attemptId) {
        const { data: ins } = await supabase
          .from("post_platform_attempts")
          .insert({ post_id: post.id, platform, status: "pending" })
          .select("id")
          .single();
        attemptId = ins?.id;
      } else if (existing?.status === "published" || existing?.status === "needs_manual") {
        continue;
      }

      // Check brand_account
      const { data: account } = await supabase
        .from("brand_accounts")
        .select("*")
        .eq("brand_id", post.brand_id)
        .eq("platform", platform)
        .eq("is_connected", true)
        .eq("auto_publish_enabled", true)
        .maybeSingle();

      if (!account) {
        await supabase
          .from("post_platform_attempts")
          .update({ status: "needs_manual", last_error: "No connected account; manual posting required." })
          .eq("id", attemptId!);

        // Notify the post creator
        const { data: postRow } = await supabase
          .from("posts")
          .select("created_by, brand_id")
          .eq("id", post.id)
          .single();
        if (postRow?.created_by) {
          await supabase.from("notifications").insert({
            user_id: postRow.created_by,
            type: "needs_manual_post",
            post_id: post.id,
            brand_id: postRow.brand_id,
            message: `Your scheduled post needs manual posting on ${platform.replace("_", " ")}.`,
          });
        }
        processed++;
        continue;
      }

      // Auto-publish path: invoke publish-post (stubbed for now)
      try {
        const res = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/publish-post`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({ attempt_id: attemptId }),
          },
        );
        if (!res.ok) throw new Error(`publish-post returned ${res.status}`);
      } catch (e) {
        await supabase
          .from("post_platform_attempts")
          .update({ status: "failed", last_error: String(e) })
          .eq("id", attemptId!);
      }
      processed++;
    }

    // If all attempts published, mark post published
    const { data: attempts } = await supabase
      .from("post_platform_attempts")
      .select("status")
      .eq("post_id", post.id);
    if (attempts && attempts.length > 0 && attempts.every(a => a.status === "published")) {
      await supabase
        .from("posts")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", post.id);
    }
  }

  return new Response(JSON.stringify({ processed, due: duePosts?.length ?? 0 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
