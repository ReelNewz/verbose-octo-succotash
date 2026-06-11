import { useEffect, useState } from "react";
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

type SocialAdSpyEntry = Database["public"]["Tables"]["social_ad_spy"]["Row"];
type Platform = SocialAdSpyEntry["platform"];

const PLATFORMS: Platform[] = ["Facebook", "Instagram", "TikTok", "LinkedIn", "Google", "Other"];

const emptyForm = {
  competitor_name: "",
  platform: "Facebook" as Platform,
  ad_copy: "",
  image_url: "",
  notes: "",
  date_observed: new Date().toISOString().slice(0, 10),
};

export default function SocialAdSpy() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<SocialAdSpyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SocialAdSpyEntry | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("social_ad_spy")
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

  const openEdit = (entry: SocialAdSpyEntry) => {
    setEditing(entry);
    setForm({
      competitor_name: entry.competitor_name,
      platform: entry.platform,
      ad_copy: entry.ad_copy ?? "",
      image_url: entry.image_url ?? "",
      notes: entry.notes ?? "",
      date_observed: entry.date_observed,
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !form.competitor_name) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      competitor_name: form.competitor_name,
      platform: form.platform,
      ad_copy: form.ad_copy || null,
      image_url: form.image_url || null,
      notes: form.notes || null,
      date_observed: form.date_observed || new Date().toISOString().slice(0, 10),
    };

    const { error } = editing
      ? await supabase.from("social_ad_spy").update(payload).eq("id", editing.id)
      : await supabase.from("social_ad_spy").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("Couldn't save ad", { description: error.message });
      return;
    }

    toast.success(editing ? "Ad updated" : "Ad added");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("social_ad_spy").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete ad", { description: error.message });
      return;
    }
    toast.success("Ad deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Log Competitor Ad
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Ad" : "Log Competitor Ad"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sas-competitor">Competitor Name</Label>
                  <Input id="sas-competitor" value={form.competitor_name} onChange={(e) => setForm((f) => ({ ...f, competitor_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v as Platform }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sas-copy">Ad Copy</Label>
                <Textarea id="sas-copy" rows={3} value={form.ad_copy} onChange={(e) => setForm((f) => ({ ...f, ad_copy: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sas-image">Image URL</Label>
                  <Input id="sas-image" placeholder="https://..." value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sas-date">Date Observed</Label>
                  <Input id="sas-date" type="date" value={form.date_observed} onChange={(e) => setForm((f) => ({ ...f, date_observed: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sas-notes">Notes</Label>
                <Textarea id="sas-notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={saving || !form.competitor_name}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Log Ad"}
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
        <EmptyState icon={Eye} title="No ads logged yet" description="Log a competitor's ad to start tracking their social strategy." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="flex flex-col">
              {entry.image_url && (
                <img src={entry.image_url} alt={`${entry.competitor_name} ad`} className="h-40 w-full rounded-t-lg object-cover" />
              )}
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{entry.competitor_name}</CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">{entry.platform}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.date_observed)}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                {entry.ad_copy && <p className="text-sm">{entry.ad_copy}</p>}
                {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
