import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Event {
  id: string;
  email: string | null;
  event: string;
  created_at: string;
  resource_id: string | null;
}

export default function DownloadsAnalytics() {
  const [events, setEvents] = useState<Event[]>([]);
  const [resources, setResources] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ total7d: 0, redeemed7d: 0, uniqueEmails: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ev }, { data: res }] = await Promise.all([
        supabase.from("download_events").select("id, email, event, created_at, resource_id").order("created_at", { ascending: false }).limit(200),
        supabase.from("resources").select("id, title"),
      ]);
      const map: Record<string, string> = {};
      (res ?? []).forEach((r: any) => { map[r.id] = r.title; });
      setResources(map);
      const all = (ev ?? []) as Event[];
      setEvents(all);
      const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = all.filter(e => new Date(e.created_at).getTime() >= since);
      setStats({
        total7d: recent.length,
        redeemed7d: recent.filter(e => e.event === "redeemed").length,
        uniqueEmails: new Set(recent.map(e => e.email).filter(Boolean)).size,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-3xl font-black mb-6">Downloads</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Events (7d)" value={stats.total7d} />
        <Stat label="Redeemed (7d)" value={stats.redeemed7d} />
        <Stat label="Unique emails (7d)" value={stats.uniqueEmails} />
      </div>
      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>}
            {!loading && events.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No download activity yet.</TableCell></TableRow>}
            {events.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-muted-foreground text-sm">{new Date(e.created_at).toLocaleString()}</TableCell>
                <TableCell>{e.resource_id ? (resources[e.resource_id] ?? "—") : "—"}</TableCell>
                <TableCell className="text-muted-foreground">{e.email ?? "—"}</TableCell>
                <TableCell><span className="font-stencil text-[10px] uppercase">{e.event}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="font-stencil text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-black mt-1">{value}</div>
    </div>
  );
}
