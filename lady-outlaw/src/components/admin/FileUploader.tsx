import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, FileCheck, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  bucket: string;
  pathPrefix?: string;
  value?: { storage_path?: string | null; file_name?: string | null; size_bytes?: number | null; content_type?: string | null };
  onUploaded: (meta: { storage_path: string; file_name: string; content_type: string; size_bytes: number }) => void;
  onClear?: () => void;
  accept?: string;
}

export function FileUploader({ bucket, pathPrefix = "", value, onUploaded, onClear, accept }: Props) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${pathPrefix}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (error) throw error;
      onUploaded({
        storage_path: path,
        file_name: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
      toast.success("File uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border border-dashed border-border bg-card p-4">
      {value?.storage_path ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileCheck className="h-5 w-5 text-gold shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{value.file_name ?? value.storage_path}</div>
              <div className="text-xs text-muted-foreground">
                {value.size_bytes ? `${Math.round(value.size_bytes / 1024)} KB` : ""} {value.content_type ?? ""}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <label>
              <input type="file" className="hidden" accept={accept} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <Button asChild size="sm" variant="outline"><span><Upload className="h-3 w-3 mr-1" />Replace</span></Button>
            </label>
            {onClear && <Button size="icon" variant="ghost" onClick={onClear}><X className="h-4 w-4" /></Button>}
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 py-6 cursor-pointer text-muted-foreground hover:text-foreground">
          <Upload className="h-6 w-6" />
          <span className="font-stencil text-xs">{uploading ? "Uploading…" : "Click to upload a file"}</span>
          <input type="file" className="hidden" accept={accept} disabled={uploading}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      )}
    </div>
  );
}
