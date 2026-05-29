import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type Mode = "generate" | "rewrite" | "hashtags";

function platformGuide(platform?: string) {
  switch (platform) {
    case "instagram":
      return "Instagram-friendly: warm, visual-driven, 1-3 short paragraphs, friendly emojis, end with light call-to-action. Max ~2200 chars.";
    case "linkedin":
      return "LinkedIn-style: professional, insightful, structured with short paragraphs, no excessive emojis. Max ~3000 chars.";
    case "facebook":
      return "Facebook-style: conversational, community-oriented, can be a bit longer with a clear hook.";
    case "threads":
      return "Threads-style: casual, punchy, conversational, under 500 characters.";
    case "google_business":
      return "Google Business Post: concise (under 1500 chars), action-oriented, mention offers/locations when relevant.";
    default:
      return "Adaptable across major social platforms; clear hook, value, and call-to-action.";
  }
}

function buildMessages(mode: Mode, payload: any) {
  if (mode === "generate") {
    const platforms: string[] = payload.platforms ?? [];
    const sys = `You are an expert social media copywriter for the brand "${
      payload.brandName ?? "the brand"
    }". Write a single post draft. Be concrete, on-brand, and avoid clichés. Do not wrap output in quotes. ${
      platforms[0] ? "Optimize for: " + platformGuide(platforms[0]) : ""
    }`;
    return [
      { role: "system", content: sys },
      {
        role: "user",
        content: `Idea: ${payload.idea}\nTarget platforms: ${
          platforms.join(", ") || "general"
        }\n\nWrite the post now. Return only the post text.`,
      },
    ];
  }

  if (mode === "rewrite") {
    const sys = `You are an expert social media copywriter. Rewrite the user's post to feel native to ${
      payload.platform
    }. ${platformGuide(payload.platform)} Keep the meaning. Return only the rewritten post text.`;
    return [
      { role: "system", content: sys },
      { role: "user", content: payload.content },
    ];
  }

  // hashtags
  const sys =
    "You suggest concise, relevant, low-spam hashtags for a social media post. Only return real hashtags people would search.";
  return [
    { role: "system", content: sys },
    {
      role: "user",
      content: `Suggest 5-10 hashtags for this post. Return them via the tool.\n\nPost:\n${payload.content}`,
    },
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth (verify_jwt is false by default; validate in code)
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
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const mode = body.mode as Mode;
    if (!["generate", "rewrite", "hashtags"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate per-mode
    if (mode === "generate" && (typeof body.idea !== "string" || body.idea.trim().length < 3)) {
      return new Response(JSON.stringify({ error: "idea required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "rewrite" && (!body.content || !body.platform)) {
      return new Response(JSON.stringify({ error: "content and platform required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "hashtags" && !body.content) {
      return new Response(JSON.stringify({ error: "content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages = buildMessages(mode, body);

    if (mode === "hashtags") {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          tools: [
            {
              type: "function",
              function: {
                name: "return_hashtags",
                description: "Return hashtag suggestions.",
                parameters: {
                  type: "object",
                  properties: {
                    hashtags: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 5,
                      maxItems: 10,
                    },
                  },
                  required: ["hashtags"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_hashtags" } },
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        return new Response(JSON.stringify({ error: t }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      const args =
        data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}";
      let parsed: { hashtags?: string[] } = {};
      try {
        parsed = JSON.parse(args);
      } catch {
        parsed = {};
      }
      const cleaned = (parsed.hashtags ?? [])
        .map((h) => h.trim())
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
        .filter((h) => h.length > 1);
      return new Response(JSON.stringify({ hashtags: cleaned }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream for generate / rewrite
    const upstream = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (upstream.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await upstream.text();
      return new Response(JSON.stringify({ error: t }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
