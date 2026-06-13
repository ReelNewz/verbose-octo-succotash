import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const [counts, setCounts] = useState({ published: 0, drafts: 0, featured: 0, categories: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [pub, drf, feat, cat, rec] = await Promise.all([
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("articles").select("id", { count: "exact", head: true }).eq("featured", true),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("articles").select("id, title, status, updated_at").order("updated_at", { ascending: false }).limit(5),
      ]);
      setCounts({
        published: pub.count ?? 0,
        drafts: drf.count ?? 0,
        featured: feat.count ?? 0,
        categories: cat.count ?? 0,
      });
      setRecent(rec.data ?? []);
    })();
  }, []);

  const stats = [
    { label: "Published", val: counts.published },
    { label: "Drafts", val: counts.drafts },
    { label: "Featured", val: counts.featured },
    { label: "Categories", val: counts.categories },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="stamp text-xs mb-2">Newsroom CMS</div>
          <h1 className="font-display text-3xl font-black">Dashboard</h1>
        </div>
        <Button asChild className="bg-primary font-stencil"><Link to="/admin/articles/new"><Plus className="h-4 w-4 mr-1" /> New Article</Link></Button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="font-stencil text-xs text-muted-foreground tracking-widest">{s.label}</CardTitle></CardHeader>
            <CardContent><div className="font-display text-4xl font-black">{s.val}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="font-display text-lg">Recently Updated</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between">
                  <Link to={`/admin/articles/${r.id}`} className="hover:text-primary">{r.title}</Link>
                  <span className="font-stencil text-[10px] text-muted-foreground uppercase">{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
