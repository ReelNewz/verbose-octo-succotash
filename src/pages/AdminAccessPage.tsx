import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/constants";

export default function AdminAccessPage() {
  const { user, loading } = useAuth();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("admin_requests").insert({
      user_id: user.id,
      email: user.email ?? "",
      reason: reason || null,
    });

    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto flex items-center gap-2 font-bold">
            <TrendingUp className="h-6 w-6 text-primary" />
            NexaMarketing
          </Link>
          <ShieldCheck className="mx-auto mt-2 h-8 w-8 text-primary" />
          <CardTitle className="mt-2">Request Admin Access</CardTitle>
          <CardDescription>
            Admin access lets you view contact submissions and leads across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
          ) : !user ? (
            <Alert>
              <AlertTitle>Sign in required</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>You'll need to sign in before requesting admin access.</p>
                <Button asChild size="sm">
                  <Link to="/login" state={{ from: { pathname: "/admin-access" } }}>Sign in</Link>
                </Button>
                <p>
                  Or email us directly at{" "}
                  <a href={`mailto:${COMPANY.email}`} className="font-medium text-primary underline-offset-4 hover:underline">
                    {COMPANY.email}
                  </a>
                  .
                </p>
              </AlertDescription>
            </Alert>
          ) : submitted ? (
            <Alert>
              <AlertTitle>Request submitted</AlertTitle>
              <AlertDescription>
                Thanks! Your request has been received and a current admin will review it.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="reason">Why do you need admin access?</Label>
                <Textarea
                  id="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. I'm the account owner and need to review incoming leads"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <Link to="/dashboard" className="hover:text-foreground">&larr; Back to dashboard</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
