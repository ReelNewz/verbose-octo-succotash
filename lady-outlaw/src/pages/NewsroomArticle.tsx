import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function NewsroomArticle() {
  const { slug } = useParams();
  const [article, setArticle] = useState<any | null>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase
        .from("articles")
        .select("*, categories(name, slug)")
        .eq("slug", slug!)
        .eq("status", "published")
        .maybeSingle();
      setArticle(a);
      if (a) {
        const { data: ev } = await supabase
          .from("article_evidence")
          .select("*")
          .eq("article_id", a.id)
          .order("sort_order");
        setEvidence(ev ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <Layout><div className="container py-24 text-muted-foreground">Loading…</div></Layout>;
  if (!article) return <Layout><div className="container py-24">
    <h1 className="font-display text-3xl font-black">Not found</h1>
    <Link to="/newsroom" className="text-primary text-sm">← Back to Newsroom</Link>
  </div></Layout>;

  return (
    <Layout>
      <article className="container py-12 max-w-3xl">
        <Link to="/newsroom" className="inline-flex items-center gap-1 font-stencil text-xs text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Newsroom
        </Link>

        {article.categories?.name && <div className="stamp text-xs mb-3">{article.categories.name}</div>}
        <h1 className="font-display text-4xl md:text-5xl font-black leading-tight mb-4">{article.title}</h1>
        <div className="font-typewriter text-xs text-muted-foreground mb-8">
          {article.published_at && new Date(article.published_at).toLocaleDateString()}
          {article.author_name && <> · {article.author_name}</>}
        </div>

        {article.cover_image_url && (
          <img src={article.cover_image_url} alt="" className="w-full aspect-video object-cover border border-border mb-8" />
        )}

        {article.summary && <p className="text-lg text-muted-foreground mb-8 border-l-2 border-primary pl-4">{article.summary}</p>}

        {article.body_html && (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body_html) }}
          />
        )}

        {evidence.length > 0 && (
          <div className="mt-12 border border-gold/40 p-6 bg-card">
            <div className="stamp text-xs mb-3">Evidence Board</div>
            <ul className="space-y-2">
              {evidence.map((e) => (
                <li key={e.id}>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="h-4 w-4" /> {e.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </Layout>
  );
}
