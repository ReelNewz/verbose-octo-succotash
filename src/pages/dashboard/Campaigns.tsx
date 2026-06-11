import { useEffect, useState } from "react";
import { Loader2, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignStatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignChannel = Campaign["channel"];
type CampaignStatus = Campaign["status"];

const CHANNELS: CampaignChannel[] = ["Facebook", "Instagram", "Google Ads", "Email", "SEO", "Other"];
const STATUSES: CampaignStatus[] = ["Draft", "Active", "Paused", "Completed"];

const emptyForm = {
  name: "",
  channel: "Facebook" as CampaignChannel,
  status: "Draft" as CampaignStatus,
  budget: "0",
  spend: "0",
  revenue: "0",
  start_date: "",
  end_date: "",
};

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCampaigns(data ?? []);
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

  const openEdit = (campaign: Campaign) => {
    setEditing(campaign);
    setForm({
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      budget: String(campaign.budget),
      spend: String(campaign.spend),
      revenue: String(campaign.revenue),
      start_date: campaign.start_date ?? "",
      end_date: campaign.end_date ?? "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      name: form.name,
      channel: form.channel,
      status: form.status,
      budget: Number(form.budget) || 0,
      spend: Number(form.spend) || 0,
      revenue: Number(form.revenue) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    const { error } = editing
      ? await supabase.from("campaigns").update(payload).eq("id", editing.id)
      : await supabase.from("campaigns").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("Couldn't save campaign", { description: error.message });
      return;
    }

    toast.success(editing ? "Campaign updated" : "Campaign created");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete campaign", { description: error.message });
      return;
    }
    toast.success("Campaign deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">Manage your marketing campaigns and track performance.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Name</Label>
                <Input id="campaign-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Channel</Label>
                  <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v as CampaignChannel }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as CampaignStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-budget">Budget ($)</Label>
                  <Input id="campaign-budget" type="number" min="0" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-spend">Spend ($)</Label>
                  <Input id="campaign-spend" type="number" min="0" value={form.spend} onChange={(e) => setForm((f) => ({ ...f, spend: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-revenue">Revenue ($)</Label>
                  <Input id="campaign-revenue" type="number" min="0" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-start">Start Date</Label>
                  <Input id="campaign-start" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-end">End Date</Label>
                  <Input id="campaign-end" type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={saving || !form.name}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Campaign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : campaigns.length === 0 ? (
            <EmptyState icon={Megaphone} title="No campaigns yet" description="Create your first campaign to start tracking performance." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Spend</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.channel}</TableCell>
                    <TableCell><CampaignStatusBadge status={campaign.status} /></TableCell>
                    <TableCell>{formatCurrency(Number(campaign.budget))}</TableCell>
                    <TableCell>{formatCurrency(Number(campaign.spend))}</TableCell>
                    <TableCell>{formatCurrency(Number(campaign.revenue))}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(campaign)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)}>
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
