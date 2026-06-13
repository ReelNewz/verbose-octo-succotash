import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploader({ value, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("article-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("article-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative">
          <img src={value} alt="cover" className="w-full aspect-video object-cover border border-border" />
          <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="border-2 border-dashed border-border bg-input/40 flex flex-col items-center justify-center aspect-video cursor-pointer hover:border-primary transition-colors">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="font-stencil text-xs text-muted-foreground">
            {busy ? "Uploading…" : "Upload cover image"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
      )}
    </div>
  );
}
