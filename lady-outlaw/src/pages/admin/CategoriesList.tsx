import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";

interface Row { id?: string; name: string; slug: string; description: string | null; sort_order: number; }

export default function CategoriesList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row>({ name: "", slug: "", description: "", sort_order: 0 });

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order").order("name");
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.name.trim()) return;
    const payload = { ...draft, slug: draft.slug || slugify(draft.name) };
    const { error } = await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    setDraft({ name: "", slug: "", description: "", sort_order: 0 });
    toast.success("Created");
    load();
  };

  const save = async (r: Row) => {
    const { error } = await supabase.from("categories").update({
      name: r.name, slug: r.slug, description: r.description, sort_order: r.sort_order,
    }).eq("id", r.id!);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete category? Articles will be unlinked.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-black mb-6">Categories</h1>

      <div className="border border-border bg-card p-4 mb-6 space-y-2">
        <div className="font-stencil text-xs text-muted-foreground tracking-widest">Add Category</div>
        <div className="grid md:grid-cols-4 gap-2">
          <Input placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.slug || slugify(e.target.value) })} className="bg-input border-border" />
          <Input placeholder="slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="bg-input border-border" />
          <Textarea placeholder="Description" value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="bg-input border-border md:col-span-2 min-h-[40px]" />
        </div>
        <Button onClick={create} className="bg-primary font-stencil"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20">Order</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell><Input value={r.name} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} className="bg-input border-border" /></TableCell>
                <TableCell><Input value={r.slug} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, slug: e.target.value } : x))} className="bg-input border-border" /></TableCell>
                <TableCell><Input value={r.description ?? ""} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} className="bg-input border-border" /></TableCell>
                <TableCell><Input type="number" value={r.sort_order} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, sort_order: Number(e.target.value) } : x))} className="bg-input border-border" /></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => save(r)}><Save className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id!)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No categories yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
