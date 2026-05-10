import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldOff } from "lucide-react";

export const ProtectedRoute = ({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [adminState, setAdminState] = useState<"checking" | "allowed" | "denied" | "error">(
    adminOnly ? "checking" : "allowed",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!adminOnly) return;
    if (!user) return;
    let cancelled = false;
    setAdminState("checking");
    setErrorMessage(null);
    supabase.rpc("is_current_user_admin").then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setErrorMessage(error.message);
        setAdminState("error");
        return;
      }
      setAdminState(data === true ? "allowed" : "denied");
    });
    return () => { cancelled = true; };
  }, [adminOnly, user?.id]);

  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly) {
    if (adminState === "checking") return <div className="flex h-screen items-center justify-center text-muted-foreground">Verifying access…</div>;
    if (adminState === "denied") {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <Alert className="max-w-md">
            <ShieldOff className="h-4 w-4" />
            <AlertTitle>Access denied</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>Your account does not have admin permissions. If you just gained access, sign out and back in to refresh your session.</p>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline"><a href="/dashboard">Go to dashboard</a></Button>
                <Button asChild size="sm" variant="ghost"><a href="/admin-access">Request access</a></Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    if (adminState === "error") {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Verification error</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>We couldn't verify your admin permissions.</p>
              {errorMessage && <p className="font-mono text-xs opacity-80">{errorMessage}</p>}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                <Button asChild size="sm" variant="ghost"><a href="/dashboard">Back to dashboard</a></Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }
  return children;
};
