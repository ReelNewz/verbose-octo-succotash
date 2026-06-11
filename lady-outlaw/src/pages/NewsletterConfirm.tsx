import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "ok" | "already" | "error";

const NewsletterConfirm = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setMessage("Missing confirmation token."); return; }
    (async () => {
      const { data, error } = await supabase.functions.invoke("confirm-newsletter", {
        body: { token },
      });
      if (error) { setState("error"); setMessage(error.message); return; }
      if (data?.alreadyConfirmed) { setState("already"); return; }
      if (data?.ok) { setState("ok"); return; }
      setState("error"); setMessage(data?.error || "Could not confirm.");
    })();
  }, [token]);

  return (
    <Layout>
      <section className="container py-32 max-w-2xl">
        <div className="stamp text-xs mb-4">DISPATCH CONFIRMATION</div>
        {state === "loading" && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Verifying your enlistment…
          </div>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-gold mb-4" />
            <h1 className="font-display text-4xl font-black mb-3">You're in.</h1>
            <p className="text-muted-foreground font-typewriter">
              Your subscription to the Outlaw Dispatch is confirmed. Investigations, FOIA drops and
              whistleblower bulletins will hit your inbox.
            </p>
          </>
        )}
        {state === "already" && (
          <>
            <CheckCircle2 className="h-10 w-10 text-gold mb-4" />
            <h1 className="font-display text-4xl font-black mb-3">Already confirmed.</h1>
            <p className="text-muted-foreground font-typewriter">You're on the list. Stand by.</p>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="h-10 w-10 text-primary mb-4" />
            <h1 className="font-display text-4xl font-black mb-3">Confirmation failed.</h1>
            <p className="text-muted-foreground font-typewriter">{message}</p>
          </>
        )}
        <Button asChild className="mt-8 font-stencil"><Link to="/">Back to base</Link></Button>
      </section>
    </Layout>
  );
};

export default NewsletterConfirm;
