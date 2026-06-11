import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  resourceSlug: z.string().min(1).max(200),
  email: z.string().trim().email().max(255).optional(),
  name: z.string().trim().max(120).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { resourceSlug, email, name } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: resource, error: resErr } = await supabase
      .from("resources")
      .select("id, gated, published, storage_path")
      .eq("slug", resourceSlug)
      .maybeSingle();

    if (resErr || !resource || !resource.published) {
      return new Response(JSON.stringify({ error: "Resource not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resource.storage_path) {
      return new Response(JSON.stringify({ error: "Resource file not available" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resource.gated && !email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    const ua = req.headers.get("user-agent") ?? null;

    const { data: token, error: tokErr } = await supabase
      .from("download_tokens")
      .insert({
        resource_id: resource.id,
        email: email ?? null,
        created_ip: ip,
        user_agent: ua,
        max_uses: resource.gated ? 3 : 1,
      })
      .select("id")
      .single();

    if (tokErr || !token) {
      return new Response(JSON.stringify({ error: "Could not create token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("download_events").insert({
      token_id: token.id,
      resource_id: resource.id,
      email: email ?? null,
      event: "requested",
      ip,
      user_agent: ua,
    });

    // For gated requests, also subscribe email to newsletter (pending)
    if (resource.gated && email) {
      await supabase.from("newsletter_subscribers").insert({
        name: name ?? email.split("@")[0],
        email,
        status: "pending",
      });
    }

    const base = Deno.env.get("SUPABASE_URL")!;
    const downloadUrl = `${base}/functions/v1/download-file?token=${token.id}`;

    return new Response(
      JSON.stringify({ downloadUrl, expiresInHours: 24 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("request-download error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
