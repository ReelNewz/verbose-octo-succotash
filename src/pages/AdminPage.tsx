import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

type ContactSubmission = Database["public"]["Tables"]["contact_submissions"]["Row"];
type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function AdminPage() {
  const { signOut } = useAuth();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [{ data: submissionData }, { data: leadData }] = await Promise.all([
        supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setSubmissions(submissionData ?? []);
      setLeads(leadData ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <TrendingUp className="h-6 w-6 text-primary" />
            Admin Console
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading platform data…
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Contact Submissions</CardTitle>
                <CardDescription>All messages submitted through the public contact form.</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No contact submissions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Received</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.name}</TableCell>
                          <TableCell>{submission.email}</TableCell>
                          <TableCell>{submission.phone ?? "—"}</TableCell>
                          <TableCell>{submission.company ?? "—"}</TableCell>
                          <TableCell className="max-w-xs truncate">{submission.message}</TableCell>
                          <TableCell>{formatDate(submission.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Leads</CardTitle>
                <CardDescription>Leads across every client account on the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leads yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Owner (User ID)</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell><Badge variant="secondary">{lead.status}</Badge></TableCell>
                          <TableCell>{lead.source ?? "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{lead.user_id}</TableCell>
                          <TableCell>{formatDate(lead.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
