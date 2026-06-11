import { useEffect, useState } from "react";
import { Facebook, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { simulateAdPerformance } from "@/lib/simulateAdPerformance";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { toast } from "sonner";

type MetaAdSet = Database["public"]["Tables"]["meta_ad_sets"]["Row"];
type Objective = MetaAdSet["objective"];

const OBJECTIVES: Objective[] = ["Awareness", "Traffic", "Engagement", "Leads", "Sales"];
const PLACEMENTS = ["Automatic", "Facebook Feed", "Instagram Feed", "Stories", "Reels"];

const emptyForm = {
  name: "",
  objective: "Leads" as Objective,
  audience: "",
  daily_budget: "25",
  placement: "Automatic",
};

export default function MetaAds() {
  const { user } = useAuth();
  const [adSets, setAdSets] = useState<MetaAdSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("meta_ad_sets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAdSets(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !form.name || !form.audience) return;
    setSaving(true);

    const dailyBudget = Number(form.daily_budget) || 0;
    const performance = simulateAdPerformance({ objective: form.objective, dailyBudget, audience: form.audience });

    const { error } = await supabase.from("meta_ad_sets").insert({
      user_id: user.id,
      name: form.name,
      objective: form.objective,
      audience: form.audience,
      daily_budget: dailyBudget,
      placement: form.placement,
      ...performance,
    });

    setSaving(false);

    if (error) {
      toast.error("Couldn't create ad set", { description: error.message });
      return;
    }

    toast.success("Ad set created with simulated performance");
    setForm(emptyForm);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("meta_ad_sets").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete ad set", { description: error.message });
      return;
    }
    toast.success("Ad set deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meta Ads</h1>
        <p className="text-muted-foreground">Build ad sets and preview projected performance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Ad Set</CardTitle>
          <CardDescription>We'll simulate impressions, clicks, and conversions based on your inputs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ad-name">Ad Set Name</Label>
              <Input id="ad-name" placeholder="e.g. Spring Promo - Schaumburg" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-audience">Audience</Label>
              <Input id="ad-audience" placeholder="e.g. Homeowners 30-55, NW Chicago suburbs" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Objective</Label>
              <Select value={form.objective} onValueChange={(v) => setForm((f) => ({ ...f, objective: v as Objective }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ad-budget">Daily Budget ($)</Label>
              <Input id="ad-budget" type="number" min="1" value={form.daily_budget} onChange={(e) => setForm((f) => ({ ...f, daily_budget: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Placement</Label>
              <Select value={form.placement} onValueChange={(v) => setForm((f) => ({ ...f, placement: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={saving || !form.name || !form.audience}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create Ad Set
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ad Sets &amp; Projected Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : adSets.length === 0 ? (
            <EmptyState icon={Facebook} title="No ad sets yet" description="Create your first ad set above to see projected performance." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Set</TableHead>
                  <TableHead>Objective</TableHead>
                  <TableHead>Daily Budget</TableHead>
                  <TableHead>Impressions</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>Conversions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adSets.map((adSet) => (
                  <TableRow key={adSet.id}>
                    <TableCell className="font-medium">
                      {adSet.name}
                      <div className="text-xs text-muted-foreground">{adSet.audience}</div>
                    </TableCell>
                    <TableCell>{adSet.objective}</TableCell>
                    <TableCell>{formatCurrency(Number(adSet.daily_budget))}/day</TableCell>
                    <TableCell>{formatNumber(adSet.impressions)}</TableCell>
                    <TableCell>{formatNumber(adSet.clicks)}</TableCell>
                    <TableCell>{formatPercent(Number(adSet.ctr))}</TableCell>
                    <TableCell>{formatCurrency(Number(adSet.cpc))}</TableCell>
                    <TableCell>{formatNumber(adSet.conversions)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(adSet.id)}>
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
