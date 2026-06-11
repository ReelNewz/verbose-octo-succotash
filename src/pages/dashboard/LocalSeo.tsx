import { useEffect, useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { COMPANY, MAP_EMBED_SRC } from "@/lib/constants";
import { formatDate, formatNumber } from "@/lib/format";
import { toast } from "sonner";

type LocalRanking = Database["public"]["Tables"]["local_rankings"]["Row"];

const emptyForm = {
  keyword: "",
  current_rank: "",
  target_rank: "",
  search_volume: "",
  location: "Schaumburg, IL",
  last_checked: new Date().toISOString().slice(0, 10),
};

export default function LocalSeo() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<LocalRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LocalRanking | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("local_rankings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRankings(data ?? []);
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

  const openEdit = (ranking: LocalRanking) => {
    setEditing(ranking);
    setForm({
      keyword: ranking.keyword,
      current_rank: ranking.current_rank != null ? String(ranking.current_rank) : "",
      target_rank: ranking.target_rank != null ? String(ranking.target_rank) : "",
      search_volume: ranking.search_volume != null ? String(ranking.search_volume) : "",
      location: ranking.location,
      last_checked: ranking.last_checked,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !form.keyword) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      keyword: form.keyword,
      current_rank: form.current_rank ? Number(form.current_rank) : null,
      target_rank: form.target_rank ? Number(form.target_rank) : null,
      search_volume: form.search_volume ? Number(form.search_volume) : null,
      location: form.location || "Schaumburg, IL",
      last_checked: form.last_checked || new Date().toISOString().slice(0, 10),
    };

    const { error } = editing
      ? await supabase.from("local_rankings").update(payload).eq("id", editing.id)
      : await supabase.from("local_rankings").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("Couldn't save ranking", { description: error.message });
      return;
    }

    toast.success(editing ? "Ranking updated" : "Ranking added");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("local_rankings").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete ranking", { description: error.message });
      return;
    }
    toast.success("Ranking deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Local SEO</h1>
          <p className="text-muted-foreground">Track your Google Maps and local search rankings.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Track Keyword
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Ranking" : "Track New Keyword"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-keyword">Keyword</Label>
                <Input id="seo-keyword" placeholder="e.g. dentist near me" value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seo-current-rank">Current Rank</Label>
                  <Input id="seo-current-rank" type="number" min="0" value={form.current_rank} onChange={(e) => setForm((f) => ({ ...f, current_rank: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo-target-rank">Target Rank</Label>
                  <Input id="seo-target-rank" type="number" min="0" value={form.target_rank} onChange={(e) => setForm((f) => ({ ...f, target_rank: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seo-volume">Search Volume</Label>
                  <Input id="seo-volume" type="number" min="0" value={form.search_volume} onChange={(e) => setForm((f) => ({ ...f, search_volume: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo-last-checked">Last Checked</Label>
                  <Input id="seo-last-checked" type="date" value={form.last_checked} onChange={(e) => setForm((f) => ({ ...f, last_checked: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-location">Location</Label>
                <Input id="seo-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={saving || !form.keyword}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Track Keyword"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Location</CardTitle>
          <CardDescription>{COMPANY.fullAddress}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <iframe
              title="Business location"
              src={MAP_EMBED_SRC}
              className="h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keyword Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : rankings.length === 0 ? (
            <EmptyState icon={MapPin} title="No keywords tracked yet" description="Track a keyword to start monitoring your local search rankings." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Rank</TableHead>
                  <TableHead>Target Rank</TableHead>
                  <TableHead>Search Volume</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((ranking) => (
                  <TableRow key={ranking.id}>
                    <TableCell className="font-medium">{ranking.keyword}</TableCell>
                    <TableCell>{ranking.location}</TableCell>
                    <TableCell>{ranking.current_rank != null ? `#${ranking.current_rank}` : "—"}</TableCell>
                    <TableCell>{ranking.target_rank != null ? `#${ranking.target_rank}` : "—"}</TableCell>
                    <TableCell>{ranking.search_volume != null ? formatNumber(ranking.search_volume) : "—"}</TableCell>
                    <TableCell>{formatDate(ranking.last_checked)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(ranking)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ranking.id)}>
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
