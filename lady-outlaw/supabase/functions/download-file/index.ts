import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function htmlError(message: string, status: number) {
  const body = `<!doctype html><html><head><meta charset="utf-8"><title>Download unavailable</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;background:#0a0a0a;color:#f5f5f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}main{max-width:480px;text-align:center}h1{color:#dc2626;font-weight:900;letter-spacing:.05em}p{color:#a3a3a3;line-height:1.6}a{color:#facc15}</style></head><body><main><h1>Download Unavailable</h1><p>${message}</p><p><a href="/resources">← Back to Resources</a></p></main></body></html>`;
  return new Response(body, { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const tokenId = url.searchParams.get("token");
  if (!tokenId || !/^[0-9a-f-]{36}$/i.test(tokenId)) {
    return htmlError("This download link is invalid.", 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
  const ua = req.headers.get("user-agent") ?? null;

  const { data: token } = await supabase
    .from("download_tokens")
    .select("id, resource_id, email, expires_at, max_uses, used_count")
    .eq("id", tokenId)
    .maybeSingle();

  if (!token) return htmlError("This download link was not found.", 404);

  const now = new Date();
  if (new Date(token.expires_at) < now) {
    await supabase.from("download_events").insert({
      token_id: token.id, resource_id: token.resource_id, email: token.email,
      event: "expired", ip, user_agent: ua,
    });
    return htmlError("This download link has expired. Please request a new one.", 410);
  }

  if (token.used_count >= token.max_uses) {
    await supabase.from("download_events").insert({
      token_id: token.id, resource_id: token.resource_id, email: token.email,
      event: "exhausted", ip, user_agent: ua,
    });
    return htmlError("This download link has reached its use limit.", 410);
  }

  const { data: resource } = await supabase
    .from("resources")
    .select("storage_path, file_name, content_type, published")
    .eq("id", token.resource_id)
    .maybeSingle();

  if (!resource || !resource.published || !resource.storage_path) {
    return htmlError("This resource is no longer available.", 404);
  }

  const { data: signed, error: signErr } = await supabase
    .storage
    .from("resource-files")
    .createSignedUrl(resource.storage_path, 60, {
      download: resource.file_name ?? true,
    });

  if (signErr || !signed?.signedUrl) {
    console.error("sign error", signErr);
    return htmlError("Could not generate the download link. Please try again.", 500);
  }

  await supabase.from("download_tokens")
    .update({ used_count: token.used_count + 1 })
    .eq("id", token.id);

  await supabase.from("download_events").insert({
    token_id: token.id, resource_id: token.resource_id, email: token.email,
    event: "redeemed", ip, user_agent: ua,
  });

  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, Location: signed.signedUrl },
  });
});
