import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { EvidenceLinksEditor, EvidenceItem } from "@/components/admin/EvidenceLinksEditor";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  title: z.string().trim().min(1, "Title required").max(200),
  slug: z.string().trim().min(1).max(120),
  summary: z.string().max(500).optional().nullable(),
  author_name: z.string().max(120).optional().nullable(),
});

export default function ArticleEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();

  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyJson, setBodyJson] = useState<unknown>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string>("");
  const [authorName, setAuthorName] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCats(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data: a } = await supabase.from("articles").select("*").eq("id", id!).maybeSingle();
      if (!a) { toast.error("Not found"); nav("/admin/articles"); return; }
      setTitle(a.title); setSlug(a.slug); setSlugTouched(true);
      setCategoryId(a.category_id); setSummary(a.summary ?? "");
      setBodyHtml(a.body_html ?? ""); setBodyJson(a.body_json);
      setCoverUrl(a.cover_image_url); setStatus(a.status); setFeatured(a.featured);
      setPublishedAt(a.published_at ? new Date(a.published_at).toISOString().slice(0, 16) : "");
      setAuthorName(a.author_name ?? "");
      const { data: ev } = await supabase.from("article_evidence").select("*").eq("article_id", id!).order("sort_order");
      setEvidence((ev ?? []).map((e) => ({ id: e.id, label: e.label, url: e.url })));
      setLoading(false);
    })();
  }, [id, isNew, nav]);

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const save = async () => {
    const parsed = schema.safeParse({ title, slug, summary, author_name: authorName });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        title, slug, category_id: categoryId,
        summary: summary || null,
        body_html: bodyHtml || null,
        body_json: (bodyJson ?? null) as any,
        cover_image_url: coverUrl,
        status, featured,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : (status === "published" ? new Date().toISOString() : null),
        author_name: authorName || null,
        ...(isNew ? { created_by: userData.user?.id } : {}),
      };

      let articleId = id;
      if (isNew) {
        const { data, error } = await supabase.from("articles").insert(payload as any).select("id").single();
        if (error) throw error;
        articleId = data.id;
      } else {
        const { error } = await supabase.from("articles").update(payload).eq("id", id!);
        if (error) throw error;
      }

      // Replace evidence
      await supabase.from("article_evidence").delete().eq("article_id", articleId!);
      const cleanEv = evidence.filter((e) => e.label.trim() && e.url.trim());
      if (cleanEv.length) {
        const { error } = await supabase.from("article_evidence").insert(
          cleanEv.map((e, i) => ({ article_id: articleId!, label: e.label.trim(), url: e.url.trim(), sort_order: i }))
        );
        if (error) throw error;
      }

      toast.success("Saved");
      if (isNew) nav(`/admin/articles/${articleId}`, { replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => nav("/admin/articles")} className="flex items-center gap-1 font-stencil text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Articles
        </button>
        <Button onClick={save} disabled={busy} className="bg-primary font-stencil">{busy ? "Saving…" : "Save"}</Button>
      </div>

      <h1 className="font-display text-3xl font-black">{isNew ? "New Article" : "Edit Article"}</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-input border-border text-lg" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} className="bg-input border-border font-typewriter" />
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={500} className="bg-input border-border" />
          </div>
          <div>
            <Label>Body</Label>
            <RichTextEditor valueHtml={bodyHtml} onChange={(html, json) => { setBodyHtml(html); setBodyJson(json); }} />
          </div>
          <div>
            <Label>Evidence Links</Label>
            <EvidenceLinksEditor value={evidence} onChange={setEvidence} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-border bg-card p-4 space-y-4">
            <div className="font-stencil text-xs text-muted-foreground tracking-widest">Publishing</div>
            <div className="flex items-center justify-between">
              <Label htmlFor="status">Published</Label>
              <Switch id="status" checked={status === "published"} onCheckedChange={(v) => setStatus(v ? "published" : "draft")} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="feat">Featured</Label>
              <Switch id="feat" checked={featured} onCheckedChange={setFeatured} />
            </div>
            <div>
              <Label>Publish date</Label>
              <Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className="bg-input border-border" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId ?? "_none"} onValueChange={(v) => setCategoryId(v === "_none" ? null : v)}>
                <SelectTrigger className="bg-input border-border"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— None —</SelectItem>
                  {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Author</Label>
              <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="bg-input border-border" />
            </div>
          </div>

          <div className="border border-border bg-card p-4 space-y-2">
            <div className="font-stencil text-xs text-muted-foreground tracking-widest">Cover Image</div>
            <ImageUploader value={coverUrl} onChange={setCoverUrl} />
          </div>
        </aside>
      </div>
    </div>
  );
}
