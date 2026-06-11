import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatNumber } from "@/lib/format";
import { toast } from "sonner";

type KeywordGap = Database["public"]["Tables"]["keyword_gaps"]["Row"];

const emptyForm = {
  keyword: "",
  our_rank: "",
  competitor_name: "",
  competitor_rank: "",
  search_volume: "",
  opportunity_score: "",
};

function opportunityVariant(score: number | null) {
  if (score == null) return "secondary" as const;
  if (score >= 70) return "success" as const;
  if (score >= 40) return "warning" as const;
  return "secondary" as const;
}

export default function KeywordGap() {
  const { user } = useAuth();
  const [gaps, setGaps] = useState<KeywordGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KeywordGap | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("keyword_gaps")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGaps(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (gap: KeywordGap) => {
    setEditing(gap);
    setForm({
      keyword: gap.keyword,
      our_rank: gap.our_rank != null ? String(gap.our_rank) : "",
      competitor_name: gap.competitor_name,
      competitor_rank: gap.competitor_rank != null ? String(gap.competitor_rank) : "",
      search_volume: gap.search_volume != null ? String(gap.search_volume) : "",
      opportunity_score: gap.opportunity_score != null ? String(gap.opportunity_score) : "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !form.keyword || !form.competitor_name) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      keyword: form.keyword,
      our_rank: form.our_rank ? Number(form.our_rank) : null,
      competitor_name: form.competitor_name,
      competitor_rank: form.competitor_rank ? Number(form.competitor_rank) : null,
      search_volume: form.search_volume ? Number(form.search_volume) : null,
      opportunity_score: form.opportunity_score ? Number(form.opportunity_score) : null,
    };

    const { error } = editing
      ? await supabase.from("keyword_gaps").update(payload).eq("id", editing.id)
      : await supabase.from("keyword_gaps").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("Couldn't save keyword gap", { description: error.message });
      return;
    }

    toast.success(editing ? "Keyword gap updated" : "Keyword gap added");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("keyword_gaps").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete keyword gap", { description: error.message });
      return;
    }
    toast.success("Keyword gap deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Keyword Gap
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Keyword Gap" : "Add Keyword Gap"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kg-keyword">Keyword</Label>
                  <Input id="kg-keyword" value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kg-competitor">Competitor</Label>
                  <Input id="kg-competitor" value={form.competitor_name} onChange={(e) => setForm((f) => ({ ...f, competitor_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kg-our-rank">Our Rank</Label>
                  <Input id="kg-our-rank" type="number" min="0" value={form.our_rank} onChange={(e) => setForm((f) => ({ ...f, our_rank: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kg-competitor-rank">Competitor Rank</Label>
                  <Input id="kg-competitor-rank" type="number" min="0" value={form.competitor_rank} onChange={(e) => setForm((f) => ({ ...f, competitor_rank: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kg-volume">Search Volume</Label>
                  <Input id="kg-volume" type="number" min="0" value={form.search_volume} onChange={(e) => setForm((f) => ({ ...f, search_volume: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kg-opportunity">Opportunity Score (0-100)</Label>
                  <Input id="kg-opportunity" type="number" min="0" max="100" value={form.opportunity_score} onChange={(e) => setForm((f) => ({ ...f, opportunity_score: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={saving || !form.keyword || !form.competitor_name}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Add Keyword Gap"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Keyword Gaps</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : gaps.length === 0 ? (
            <EmptyState icon={Search} title="No keyword gaps yet" description="Add a keyword gap to find opportunities your competitors are winning." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Our Rank</TableHead>
                  <TableHead>Competitor</TableHead>
                  <TableHead>Their Rank</TableHead>
                  <TableHead>Search Volume</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gaps.map((gap) => (
                  <TableRow key={gap.id}>
                    <TableCell className="font-medium">{gap.keyword}</TableCell>
                    <TableCell>{gap.our_rank != null ? `#${gap.our_rank}` : "—"}</TableCell>
                    <TableCell>{gap.competitor_name}</TableCell>
                    <TableCell>{gap.competitor_rank != null ? `#${gap.competitor_rank}` : "—"}</TableCell>
                    <TableCell>{gap.search_volume != null ? formatNumber(gap.search_volume) : "—"}</TableCell>
                    <TableCell>
                      {gap.opportunity_score != null ? (
                        <Badge variant={opportunityVariant(gap.opportunity_score)}>{gap.opportunity_score}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(gap)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(gap.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
