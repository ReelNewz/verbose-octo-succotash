import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Target, Trash2 } from "lucide-react";
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
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type SwotAnalysis = Database["public"]["Tables"]["swot_analyses"]["Row"];

const emptyForm = {
  competitor_name: "",
  strengths: "",
  weaknesses: "",
  opportunities: "",
  threats: "",
};

export default function SwotBuilder() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<SwotAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SwotAnalysis | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("swot_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAnalyses(data ?? []);
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

  const openEdit = (analysis: SwotAnalysis) => {
    setEditing(analysis);
    setForm({
      competitor_name: analysis.competitor_name,
      strengths: analysis.strengths ?? "",
      weaknesses: analysis.weaknesses ?? "",
      opportunities: analysis.opportunities ?? "",
      threats: analysis.threats ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !form.competitor_name) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      competitor_name: form.competitor_name,
      strengths: form.strengths || null,
      weaknesses: form.weaknesses || null,
      opportunities: form.opportunities || null,
      threats: form.threats || null,
    };

    const { error } = editing
      ? await supabase.from("swot_analyses").update(payload).eq("id", editing.id)
      : await supabase.from("swot_analyses").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("Couldn't save analysis", { description: error.message });
      return;
    }

    toast.success(editing ? "Analysis updated" : "Analysis created");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("swot_analyses").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete analysis", { description: error.message });
      return;
    }
    toast.success("Analysis deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New SWOT Analysis
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit SWOT Analysis" : "New SWOT Analysis"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="swot-competitor">Competitor Name</Label>
                <Input id="swot-competitor" value={form.competitor_name} onChange={(e) => setForm((f) => ({ ...f, competitor_name: e.target.value }))} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="swot-strengths">Strengths</Label>
                  <Textarea id="swot-strengths" rows={4} value={form.strengths} onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swot-weaknesses">Weaknesses</Label>
                  <Textarea id="swot-weaknesses" rows={4} value={form.weaknesses} onChange={(e) => setForm((f) => ({ ...f, weaknesses: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swot-opportunities">Opportunities</Label>
                  <Textarea id="swot-opportunities" rows={4} value={form.opportunities} onChange={(e) => setForm((f) => ({ ...f, opportunities: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swot-threats">Threats</Label>
                  <Textarea id="swot-threats" rows={4} value={form.threats} onChange={(e) => setForm((f) => ({ ...f, threats: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={saving || !form.competitor_name}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Analysis"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : analyses.length === 0 ? (
        <EmptyState icon={Target} title="No SWOT analyses yet" description="Create your first competitor SWOT analysis to find your edge." />
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>{analysis.competitor_name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(analysis)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(analysis.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="text-sm font-semibold text-success">Strengths</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{analysis.strengths || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-sm font-semibold text-destructive">Weaknesses</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{analysis.weaknesses || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-sm font-semibold text-primary">Opportunities</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{analysis.opportunities || "—"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-sm font-semibold text-warning">Threats</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{analysis.threats || "—"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
