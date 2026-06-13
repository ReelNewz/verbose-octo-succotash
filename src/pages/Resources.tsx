import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Lock, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Resource {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  gated: boolean;
}

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [gated, setGated] = useState<Resource | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unlockedUrl, setUnlockedUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("resources")
        .select("id, title, slug, category, description, gated")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });
      setResources((data as Resource[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const cats = ["All", ...Array.from(new Set(resources.map(r => r.category)))];
  const filtered = resources.filter(r => cat === "All" || r.category === cat);

  const request = async (resource: Resource, providedEmail?: string) => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-download", {
        body: {
          resourceSlug: resource.slug,
          email: providedEmail,
          name: name || undefined,
        },
      });
      if (error || !data?.downloadUrl) throw new Error(error?.message ?? "Could not get download link");
      return data.downloadUrl as string;
    } finally {
      setSubmitting(false);
    }
  };

  const openDirect = async (r: Resource) => {
    try {
      const url = await request(r);
      window.location.href = url;
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gated) return;
    try {
      const url = await request(gated, email);
      setUnlockedUrl(url);
      toast({ title: "Link ready.", description: "Your download link is valid for 24 hours." });
    } catch (err: any) {
      toast({ title: "Could not unlock", description: err.message, variant: "destructive" });
    }
  };

  const close = () => {
    setGated(null); setEmail(""); setName(""); setUnlockedUrl(null);
  };

  return (
    <Layout>
      <section className="container py-12">
        <SectionHeading eyebrow="Resource Library" title="The War-Room Toolkit.">
          Templates, workbooks, and checklists for parents, advocates, journalists, and whistleblowers. Educational and advocacy materials — not individualized legal advice.
        </SectionHeading>

        <div className="flex flex-wrap gap-2 mb-8">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`font-stencil text-xs px-3 py-1.5 border ${cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>{c}</button>
          ))}
        </div>

        {loading && <p className="text-muted-foreground font-typewriter">Loading resources…</p>}
        {!loading && resources.length === 0 && (
          <p className="text-muted-foreground font-typewriter">No resources published yet. Check back soon.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-card border border-border hover:border-gold transition-all p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <FileText className="h-6 w-6 text-gold" />
                {r.gated ? <Lock className="h-4 w-4 text-primary" /> : <Download className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="font-stencil text-[10px] text-primary mb-2">{r.category}</div>
              <h3 className="font-display text-lg font-bold leading-tight">{r.title}</h3>
              {r.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{r.description}</p>}
              <Button
                onClick={() => r.gated ? setGated(r) : openDirect(r)}
                className="mt-4 bg-secondary hover:bg-primary font-stencil text-xs"
              >
                {r.gated ? "Unlock" : "Download"}
              </Button>
            </div>
          ))}
        </div>

        {gated && (
          <div className="fixed inset-0 z-[100] bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-primary/40 p-8 max-w-md w-full shadow-blood">
              {unlockedUrl ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-gold mb-3" />
                  <h3 className="font-display text-2xl font-black mb-2">Link Ready</h3>
                  <p className="text-sm text-muted-foreground mb-4 font-typewriter">
                    Your link to <span className="text-gold">{gated.title}</span> is valid for 24 hours and can be used up to 3 times.
                  </p>
                  <div className="flex gap-2">
                    <Button asChild className="bg-primary font-stencil flex-1">
                      <a href={unlockedUrl} target="_blank" rel="noopener noreferrer">Download Now</a>
                    </Button>
                    <Button variant="outline" onClick={close}>Close</Button>
                  </div>
                </>
              ) : (
                <form onSubmit={submit}>
                  <Lock className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-display text-2xl font-black mb-2">Gated Download</h3>
                  <p className="text-sm text-muted-foreground mb-4 font-typewriter">
                    Enter your email to unlock: <span className="text-gold">{gated.title}</span>
                  </p>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" className="bg-input mb-3" />
                  <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="bg-input mb-3" />
                  <p className="text-[11px] text-muted-foreground font-typewriter mb-3">
                    You'll be added to the Lady Outlaw briefing list (you can unsubscribe anytime).
                  </p>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting} className="bg-primary font-stencil flex-1">
                      {submitting ? "Generating…" : "Send Me the Link"}
                    </Button>
                    <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Resources;
