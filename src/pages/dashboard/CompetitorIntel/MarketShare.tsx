import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2, PieChart as PieChartIcon, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatPercent } from "@/lib/format";
import { toast } from "sonner";

type MarketShareEntry = Database["public"]["Tables"]["market_share_entries"]["Row"];

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const emptyForm = {
  competitor_name: "",
  market_share_percent: "",
  color: "",
  notes: "",
};

export default function MarketShare() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MarketShareEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MarketShareEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("market_share_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEntries(data ?? []);
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

  const openEdit = (entry: MarketShareEntry) => {
    setEditing(entry);
    setForm({
      competitor_name: entry.competitor_name,
      market_share_percent: String(entry.market_share_percent),
      color: entry.color ?? "",
      notes: entry.notes ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !form.competitor_name) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      competitor_name: form.competitor_name,
      market_share_percent: Number(form.market_share_percent) || 0,
      color: form.color || null,
      notes: form.notes || null,
    };

    const { error } = editing
      ? await supabase.from("market_share_entries").update(payload).eq("id", editing.id)
      : await supabase.from("market_share_entries").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("Couldn't save entry", { description: error.message });
      return;
    }

    toast.success(editing ? "Entry updated" : "Entry created");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("market_share_entries").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete entry", { description: error.message });
      return;
    }
    toast.success("Entry deleted");
    load();
  };

  const chartData = entries.map((entry, i) => ({
    name: entry.competitor_name,
    value: Number(entry.market_share_percent),
    color: entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Entry" : "Add Competitor"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ms-competitor">Competitor Name</Label>
                <Input id="ms-competitor" value={form.competitor_name} onChange={(e) => setForm((f) => ({ ...f, competitor_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ms-share">Market Share (%)</Label>
                  <Input id="ms-share" type="number" min="0" max="100" value={form.market_share_percent} onChange={(e) => setForm((f) => ({ ...f, market_share_percent: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ms-color">Color (optional)</Label>
                  <Input id="ms-color" placeholder="e.g. #f97316" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ms-notes">Notes</Label>
                <Textarea id="ms-notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={saving || !form.competitor_name}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Add Competitor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={PieChartIcon} title="No market share data yet" description="Add competitors to visualize the local market breakdown." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Market Share Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competitors</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Share</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.competitor_name}</TableCell>
                      <TableCell>{formatPercent(Number(entry.market_share_percent), 1)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{entry.notes ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
