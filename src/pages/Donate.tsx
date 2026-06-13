import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Heart, FileSearch, Mic, Users, Newspaper, Lock } from "lucide-react";

const AMOUNTS = [25, 50, 100, 250, 500, 1000];
const USES = [
  { icon: FileSearch, label: "FOIA filings & document review" },
  { icon: Newspaper, label: "Investigative reporting & travel" },
  { icon: Lock, label: "Whistleblower intake & source security" },
  { icon: Mic, label: "Podcast and media production" },
  { icon: Users, label: "Public education & advocacy" },
];

const Donate = () => {
  const [type, setType] = useState<"once" | "monthly">("monthly");
  const [amt, setAmt] = useState(50);

  return (
    <Layout>
      <section className="container py-12 max-w-5xl">
        <div className="stamp text-xs mb-4">Support the Mission</div>
        <SectionHeading eyebrow="Donate" title="Help Fund the Fight for Truth.">
          Lady Outlaw™ is reader-funded, ad-free, and independent. Your support pays for FOIA filings, document review, investigative travel, and the secure infrastructure that protects whistleblowers.
        </SectionHeading>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card border border-primary/40 p-8 shadow-blood">
            <div className="flex gap-2 mb-6">
              <button onClick={() => setType("once")} className={`flex-1 py-2 font-stencil text-sm ${type === "once" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>One-Time</button>
              <button onClick={() => setType("monthly")} className={`flex-1 py-2 font-stencil text-sm ${type === "monthly" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>Monthly</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmt(a)} className={`py-3 font-display text-lg border ${amt === a ? "border-gold text-gold bg-ink" : "border-border"}`}>${a}</button>
              ))}
            </div>
            <Button size="lg" className="w-full bg-primary font-stencil shadow-blood">
              <Heart className="mr-2 h-4 w-4" /> Donate ${amt} {type === "monthly" ? "/ month" : ""}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-4 font-typewriter text-center">Secure checkout · Stripe & PayPal supported</p>
          </div>

          <div>
            <h3 className="font-display text-2xl font-black mb-4">Where Your Money Goes</h3>
            <ul className="space-y-3">
              {USES.map(u => (
                <li key={u.label} className="flex items-center gap-3 bg-card border border-border p-4">
                  <u.icon className="h-5 w-5 text-gold shrink-0" />
                  <span className="text-sm">{u.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 bg-card border border-gold/40 p-8">
          <div className="stamp text-xs mb-3">Transparency</div>
          <h3 className="font-display text-2xl font-black">Independent. Reader-Funded. Accountable.</h3>
          <p className="text-muted-foreground mt-3">We publish quarterly transparency notes detailing how donor funds are deployed across investigations, FOIA, infrastructure, and media production. Lady Outlaw™ accepts no advertising from agencies, contractors, or institutions we cover.</p>
        </div>
      </section>
    </Layout>
  );
};

export default Donate;
