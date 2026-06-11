import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileUploader } from "@/components/admin/FileUploader";
import { slugify } from "@/lib/slug";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface ResourceForm {
  title: string;
  slug: string;
  category: string;
  description: string;
  storage_path: string | null;
  file_name: string | null;
  content_type: string | null;
  size_bytes: number | null;
  gated: boolean;
  published: boolean;
}

const empty: ResourceForm = {
  title: "", slug: "", category: "General", description: "",
  storage_path: null, file_name: null, content_type: null, size_bytes: null,
  gated: true, published: false,
};

export default function ResourceEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = id === "new";
  const [form, setForm] = useState<ResourceForm>(empty);
  const [saving, setSaving] = useState(false);
  const [touchedSlug, setTouchedSlug] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await supabase.from("resources").select("*").eq("id", id!).single();
      if (error) { toast.error(error.message); return; }
      setForm(data as any);
      setTouchedSlug(true);
    })();
  }, [id, isNew]);

  const set = <K extends keyof ResourceForm>(k: K, v: ResourceForm[K]) => setForm(f => ({ ...f, [k]: v }));

  const onTitle = (v: string) => {
    set("title", v);
    if (!touchedSlug) set("slug", slugify(v));
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    if (!form.slug.trim()) { toast.error("Slug required"); return; }
    if (form.published && !form.storage_path) { toast.error("Upload a file before publishing"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { ...form, created_by: user?.id };
    if (isNew) {
      const { data, error } = await supabase.from("resources").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Created");
      nav(`/admin/resources/${data.id}`);
    } else {
      const { error } = await supabase.from("resources").update(payload).eq("id", id!);
      if (error) toast.error(error.message); else toast.success("Saved");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => nav("/admin/resources")}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      <h1 className="font-display text-3xl font-black">{isNew ? "New Resource" : "Edit Resource"}</h1>

      <div className="grid gap-4 max-w-3xl">
        <div>
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => onTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => { setTouchedSlug(true); set("slug", slugify(e.target.value)); }} />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="FOIA, Evidence, Court Prep…" />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div>
          <Label>File</Label>
          <FileUploader
            bucket="resource-files"
            value={{
              storage_path: form.storage_path,
              file_name: form.file_name,
              size_bytes: form.size_bytes,
              content_type: form.content_type,
            }}
            onUploaded={(m) => setForm(f => ({ ...f, ...m }))}
            onClear={() => setForm(f => ({ ...f, storage_path: null, file_name: null, size_bytes: null, content_type: null }))}
          />
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2">
            <Switch checked={form.gated} onCheckedChange={(v) => set("gated", v)} />
            <span className="font-stencil text-xs">Email-gated</span>
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={form.published} onCheckedChange={(v) => set("published", v)} />
            <span className="font-stencil text-xs">Published</span>
          </label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={save} disabled={saving} className="bg-primary font-stencil">{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}
