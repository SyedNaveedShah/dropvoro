// ---------------------------------------------------------------------------
// youtube-metadata edge function
//
// Proxies requests to the official YouTube Data API v3 videos.list endpoint.
// The YOUTUBE_API_KEY secret is stored in Supabase Secrets and is only
// available to this edge function — NOT to the Next.js server runtime.
//
// This function:
//   - Accepts POST { "videoId": "..." }
//   - Calls https://www.googleapis.com/youtube/v3/videos with part=snippet,contentDetails
//   - Returns { title, thumbnail, duration } on success
//   - Returns { title: null, thumbnail: null, duration: null } on any error
//   - NEVER exposes the API key in the response
//   - Does NOT scrape, download, or bypass any platform restrictions
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const nullResult = {
    title: null as string | null,
    thumbnail: null as string | null,
    duration: null as string | null,
  };

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const videoId = typeof body?.videoId === "string" ? body.videoId.trim() : "";

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "videoId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey || !apiKey.trim()) {
      return new Response(
        JSON.stringify({ ...nullResult, error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${apiKey}`;

    let res: Response;
    try {
      res = await fetch(apiUrl);
    } catch {
      return new Response(
        JSON.stringify(nullResult),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!res.ok) {
      return new Response(
        JSON.stringify(nullResult),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const item = data?.items?.[0];

    if (!item) {
      return new Response(
        JSON.stringify(nullResult),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const thumbnails = item.snippet?.thumbnails ?? {};
    const thumbnail =
      thumbnails.high?.url ??
      thumbnails.medium?.url ??
      thumbnails.standard?.url ??
      thumbnails.default?.url ??
      null;

    const result = {
      title: item.snippet?.title ?? null,
      thumbnail,
      duration: item.contentDetails?.duration ?? null,
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(
      JSON.stringify(nullResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
