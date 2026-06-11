import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadStatusBadge } from "@/components/dashboard/StatusBadge";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Lead["status"];

const STATUSES: LeadStatus[] = ["New", "Contacted", "Qualified", "Closed"];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "",
  status: "New" as LeadStatus,
  notes: "",
  estimated_value: "",
};

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setLeads(data ?? []);
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

  const openEdit = (lead: Lead) => {
    setEditing(lead);
    setForm({
      name: lead.name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      source: lead.source ?? "",
      status: lead.status,
      notes: lead.notes ?? "",
      estimated_value: lead.estimated_value != null ? String(lead.estimated_value) : "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      company: form.company || null,
      source: form.source || null,
      status: form.status,
      notes: form.notes || null,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
    };

    const { error } = editing
      ? await supabase.from("leads").update(payload).eq("id", editing.id)
      : await supabase.from("leads").insert(payload);

    setSaving(false);

    if (error) {
      toast.error("Couldn't save lead", { description: error.message });
      return;
    }

    toast.success(editing ? "Lead updated" : "Lead created");
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete lead", { description: error.message });
      return;
    }
    toast.success("Lead deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Track and manage your sales pipeline.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Lead" : "New Lead"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-name">Name</Label>
                  <Input id="lead-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-company">Company</Label>
                  <Input id="lead-company" value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-email">Email</Label>
                  <Input id="lead-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-phone">Phone</Label>
                  <Input id="lead-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-source">Source</Label>
                  <Input id="lead-source" placeholder="e.g. Website, Referral" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as LeadStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lead-value">Est. Value ($)</Label>
                  <Input id="lead-value" type="number" min="0" value={form.estimated_value} onChange={(e) => setForm((f) => ({ ...f, estimated_value: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-notes">Notes</Label>
                <Textarea id="lead-notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={saving || !form.name}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Save Changes" : "Create Lead"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : leads.length === 0 ? (
            <EmptyState icon={Users} title="No leads yet" description="Add your first lead to start building your pipeline." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Est. Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.name}
                      {lead.email && <div className="text-xs text-muted-foreground">{lead.email}</div>}
                    </TableCell>
                    <TableCell>{lead.company ?? "—"}</TableCell>
                    <TableCell><LeadStatusBadge status={lead.status} /></TableCell>
                    <TableCell>{lead.source ?? "—"}</TableCell>
                    <TableCell>{lead.estimated_value != null ? formatCurrency(Number(lead.estimated_value)) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(lead)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
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
