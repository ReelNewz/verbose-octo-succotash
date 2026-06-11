import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

export default function ArticlesList() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("articles")
      .select("id, title, status, featured, published_at, updated_at, categories(name)")
      .order("updated_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); load(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-black">Articles</h1>
        <Button asChild className="bg-primary font-stencil"><Link to="/admin/articles/new"><Plus className="h-4 w-4 mr-1" /> New</Link></Button>
      </div>
      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No articles yet.</TableCell></TableRow>}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell className="text-muted-foreground">{r.categories?.name ?? "—"}</TableCell>
                <TableCell><span className="font-stencil text-[10px] uppercase">{r.status}</span></TableCell>
                <TableCell>{r.featured && <Star className="h-4 w-4 text-gold fill-gold" />}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{r.published_at ? new Date(r.published_at).toLocaleDateString() : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button asChild size="icon" variant="ghost"><Link to={`/admin/articles/${r.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
