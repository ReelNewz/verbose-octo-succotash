import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setInfo(null);

    if (mode === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";
        navigate(from, { replace: true });
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setInfo("Account created! Check your email to confirm your address, then sign in.");
        setMode("sign-in");
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto flex items-center gap-2 font-bold">
            <TrendingUp className="h-6 w-6 text-primary" />
            NexaMarketing
          </Link>
          <CardTitle className="mt-2">{mode === "sign-in" ? "Welcome back" : "Create your account"}</CardTitle>
          <CardDescription>
            {mode === "sign-in"
              ? "Sign in to access your marketing dashboard"
              : "Sign up to start managing your campaigns"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {info && (
            <Alert className="mb-4">
              <AlertTitle>Check your inbox</AlertTitle>
              <AlertDescription>{info}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "sign-in" ? "Sign In" : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          {mode === "sign-in" ? (
            <p>
              Don't have an account?{" "}
              <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setMode("sign-up")}>
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => setMode("sign-in")}>
                Sign in
              </button>
            </p>
          )}
          <p>
            <Link to="/admin-access" className="hover:text-foreground">Need admin access?</Link>
          </p>
          <p>
            <Link to="/" className="hover:text-foreground">&larr; Back to home</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
