import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, Megaphone, Users, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrency, formatPercent } from "@/lib/format";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type Lead = Database["public"]["Tables"]["leads"]["Row"];

const LEAD_STATUS_COLORS: Record<string, string> = {
  New: "hsl(var(--chart-1))",
  Contacted: "hsl(var(--chart-2))",
  Qualified: "hsl(var(--chart-4))",
  Closed: "hsl(var(--chart-3))",
};

export default function Overview() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [{ data: campaignData }, { data: leadData }] = await Promise.all([
        supabase.from("campaigns").select("*").eq("user_id", user!.id),
        supabase.from("leads").select("*").eq("user_id", user!.id),
      ]);
      if (cancelled) return;
      setCampaigns(campaignData ?? []);
      setLeads(leadData ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your dashboard…
      </div>
    );
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "Active").length;
  const totalRevenue = campaigns.reduce((sum, c) => sum + Number(c.revenue), 0);
  const closedLeads = leads.filter((l) => l.status === "Closed").length;
  const conversionRate = leads.length > 0 ? (closedLeads / leads.length) * 100 : 0;

  const campaignChartData = campaigns.slice(0, 8).map((c) => ({
    name: c.name.length > 14 ? `${c.name.slice(0, 14)}…` : c.name,
    Budget: Number(c.budget),
    Spend: Number(c.spend),
    Revenue: Number(c.revenue),
  }));

  const leadStatusData = ["New", "Contacted", "Qualified", "Closed"].map((status) => ({
    name: status,
    value: leads.filter((l) => l.status === status).length,
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">A snapshot of your campaigns and pipeline.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Leads" value={String(leads.length)} icon={Users} description={`${closedLeads} closed`} />
        <KpiCard label="Active Campaigns" value={String(activeCampaigns)} icon={Megaphone} description={`${campaigns.length} total`} />
        <KpiCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} description="Across all campaigns" />
        <KpiCard label="Conversion Rate" value={formatPercent(conversionRate, 0)} icon={TrendingUp} description="Leads to closed" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Budget, spend, and revenue by campaign</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignChartData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No campaigns yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Budget" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Spend" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Revenue" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads by Status</CardTitle>
            <CardDescription>Where your pipeline stands today</CardDescription>
          </CardHeader>
          <CardContent>
            {leadStatusData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No leads yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={leadStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {leadStatusData.map((entry) => (
                      <Cell key={entry.name} fill={LEAD_STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
