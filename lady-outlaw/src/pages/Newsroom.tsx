import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import redacted from "@/assets/redacted-texture.jpg";
import fallback from "@/assets/courthouse.jpg";

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  featured: boolean;
  categories: { name: string; slug: string } | null;
}

const Newsroom = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [cats, setCats] = useState<{ id: string; name: string }[]>([]);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("articles")
      .select("id, title, slug, summary, cover_image_url, published_at, featured, categories(name, slug)")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .then(({ data }) => setArticles((data as any) ?? []));
    supabase.from("categories").select("id, name").order("sort_order").order("name")
      .then(({ data }) => setCats(data ?? []));
  }, []);

  const filtered = useMemo(() => articles.filter((a) =>
    (cat === "All" || a.categories?.name === cat) &&
    (q === "" || a.title.toLowerCase().includes(q.toLowerCase()) || (a.summary ?? "").toLowerCase().includes(q.toLowerCase()))
  ), [articles, cat, q]);

  const featured = articles.filter((a) => a.featured).slice(0, 2);

  return (
    <Layout>
      <section className="container py-12">
        <SectionHeading eyebrow="Investigative Newsroom" title="Records. Receipts. Reckonings.">
          Document-driven reporting from the front lines of the constitutional fight.
        </SectionHeading>

        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search investigations, FOIA files, transcripts..." className="pl-10 bg-input border-border" />
          </div>
        </div>

        {featured.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {featured.map((a) => (
              <Link key={a.id} to={`/newsroom/${a.slug}`} className="group relative aspect-[16/10] overflow-hidden border border-border">
                <img src={a.cover_image_url || fallback} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  {a.categories?.name && <div className="stamp text-[10px] mb-3">{a.categories.name}</div>}
                  <h3 className="font-display text-2xl md:text-3xl font-black leading-tight">{a.title}</h3>
                  {a.summary && <p className="text-muted-foreground text-sm mt-2">{a.summary}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setCat("All")} className={`font-stencil text-xs px-3 py-1.5 border transition-all ${cat === "All" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary text-muted-foreground hover:text-foreground"}`}>All</button>
          {cats.map((c) => (
            <button key={c.id} onClick={() => setCat(c.name)} className={`font-stencil text-xs px-3 py-1.5 border transition-all ${cat === c.name ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary text-muted-foreground hover:text-foreground"}`}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground border border-dashed border-border">
              No articles published yet. Visit <Link to="/admin" className="text-primary hover:underline">the admin</Link> to add the first one.
            </div>
          )}
          {filtered.map((a) => (
            <Link to={`/newsroom/${a.slug}`} key={a.id} className="group bg-card border border-border hover:border-primary transition-all">
              <div className="aspect-video overflow-hidden">
                <img src={a.cover_image_url || fallback} alt="" loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-stencil text-[10px] text-primary">{a.categories?.name ?? ""}</span>
                  <span className="font-typewriter text-[10px] text-muted-foreground">{a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}</span>
                </div>
                <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors">{a.title}</h3>
                {a.summary && <p className="text-sm text-muted-foreground mt-2">{a.summary}</p>}
                <div className="mt-3 font-stencil text-[10px] text-gold flex items-center gap-1">Read File <ArrowRight className="h-3 w-3" /></div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 relative border border-gold/40 p-8 md:p-12 bg-card">
          <img src={redacted} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-10" />
          <div className="relative">
            <div className="stamp text-xs mb-4">Evidence Board</div>
            <h3 className="font-display text-3xl md:text-4xl font-black mb-4">Documents · Exhibits · Transcripts</h3>
            <p className="text-muted-foreground max-w-2xl">Every investigation is anchored in records. Browse FOIA productions, court filings, exhibit indexes, and source documents underlying our reporting.</p>
            <Button asChild className="mt-6 bg-primary font-stencil shadow-blood"><Link to="/resources">Open the Vault</Link></Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Newsroom;
