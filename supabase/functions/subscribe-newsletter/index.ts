import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(25).optional().or(z.literal("")),
  origin: z.string().url().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { name, email, phone, origin } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Upsert by lowercased email
    const normalizedEmail = email.toLowerCase();

    // Check existing
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, status, confirmation_token")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    let row = existing;
    if (!row) {
      const { data: inserted, error: insertErr } = await supabase
        .from("newsletter_subscribers")
        .insert({ name, email: normalizedEmail, phone: phone || null })
        .select("id, status, confirmation_token")
        .single();
      if (insertErr) {
        console.error("insert error", insertErr);
        return new Response(JSON.stringify({ error: "Could not save signup" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      row = inserted;
    } else if (existing.status === "confirmed") {
      return new Response(JSON.stringify({ ok: true, alreadyConfirmed: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Refresh name/phone on resubscribe attempt and reset to pending
      await supabase
        .from("newsletter_subscribers")
        .update({ name, phone: phone || null, status: "pending" })
        .eq("id", existing.id);
    }

    const siteOrigin = origin || req.headers.get("origin") || "";
    const confirmUrl = `${siteOrigin}/newsletter/confirm?token=${row!.confirmation_token}`;

    // Try to send the confirmation email via Lovable's transactional sender.
    try {
      const { error: sendErr } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "newsletter-confirmation",
          recipientEmail: normalizedEmail,
          idempotencyKey: `newsletter-confirm-${row!.id}`,
          templateData: { name, confirmUrl },
        },
      });
      if (sendErr) console.error("send-transactional-email error", sendErr);
    } catch (e) {
      console.error("send-transactional-email invoke failed", e);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("subscribe-newsletter error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
