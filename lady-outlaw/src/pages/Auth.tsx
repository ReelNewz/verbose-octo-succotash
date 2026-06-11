import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(128),
});

export default function Auth() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav("/admin", { replace: true });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/admin", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <section className="container py-24 max-w-md">
        <div className="stamp text-xs mb-3">Restricted Access</div>
        <h1 className="font-display text-3xl font-black mb-6">
          {mode === "signin" ? "Sign In" : "Create Account"}
        </h1>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-input border-border" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-input border-border" />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-primary font-stencil">
            {busy ? "…" : mode === "signin" ? "Sign In" : "Sign Up"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 text-xs font-stencil text-muted-foreground hover:text-primary"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
        <div className="mt-8 border border-border rounded-md p-4 bg-muted/30">
          <h2 className="font-stencil text-sm font-bold mb-3">Admin Login Help</h2>
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div>
              <p className="font-semibold text-foreground">Confirm your email</p>
              <p>After signing up, check your inbox for a confirmation link. Click it before signing in. If you don't see it, check spam or promotions folders.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Verify your admin role</p>
              <p>Your account must have the "admin" role in the database to access the dashboard. If you were just added, sign out and back in to refresh your permissions.</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Still locked out?</p>
              <p>Make sure you're using the same email that was granted admin access. If you forgot your password, sign out and use the Sign Up flow with the same email to trigger a recovery option.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">← Back home</Link>
        </div>
      </section>
    </Layout>
  );
}
