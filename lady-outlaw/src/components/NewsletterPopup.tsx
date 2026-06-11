import { useEffect, useState } from "react";
import { X, Crosshair, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const NewsletterPopup = () => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("lo_newsletter_seen")) return;
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    sessionStorage.setItem("lo_newsletter_seen", "1");
    setOpen(false);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();

    if (!name || !email) {
      toast({ title: "Missing info", description: "Name and email are required.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("subscribe-newsletter", {
      body: { name, email, phone, origin: window.location.origin },
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.alreadyConfirmed) {
      toast({ title: "You're already enlisted.", description: "Stand by for the next dispatch." });
      close();
      return;
    }
    setDone(true);
    toast({ title: "Check your inbox.", description: "Confirm your email to activate the dispatch." });
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-ink/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up">
      <div className="relative max-w-lg w-full bg-card border border-primary/40 shadow-blood overflow-hidden">
        <div className="absolute inset-0 bg-gradient-smoke pointer-events-none" />
        <button onClick={close} className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-primary"><X /></button>
        <div className="relative p-8">
          <Crosshair className="h-8 w-8 text-primary mb-4" />
          <div className="stamp mb-3 text-xs">CLASSIFIED DISPATCH</div>
          {done ? (
            <>
              <h3 className="font-display text-2xl md:text-3xl font-black mb-2">Check your inbox.</h3>
              <p className="text-sm text-muted-foreground mb-6 font-typewriter">
                We sent a confirmation link to lock in your enlistment. Click it to activate the dispatch.
              </p>
              <Button onClick={close} className="w-full bg-primary hover:bg-primary/90 font-stencil tracking-widest shadow-blood">
                Got it
              </Button>
            </>
          ) : (
            <>
              <h3 className="font-display text-2xl md:text-3xl font-black mb-2">Join the Outlaw Dispatch</h3>
              <p className="text-sm text-muted-foreground mb-6 font-typewriter">
                Investigations, FOIA drops, courthouse files & whistleblower bulletins — delivered before they bury them.
              </p>
              <form onSubmit={submit} className="space-y-3">
                <Input name="name" required maxLength={100} placeholder="Full name" className="bg-input border-border" />
                <Input name="email" required type="email" maxLength={255} placeholder="Email" className="bg-input border-border" />
                <Input name="phone" type="tel" maxLength={25} placeholder="Phone (optional)" className="bg-input border-border" />
                <Button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-primary/90 font-stencil tracking-widest shadow-blood">
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enlisting…</> : "Enlist"}
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground mt-4 font-typewriter">
                We don't sell your data. Unsubscribe anytime. Source confidentiality respected.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
