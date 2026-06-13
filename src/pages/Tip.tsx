import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Shield, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Tip = () => {
  const [consent, setConsent] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return toast({ title: "Consent required", variant: "destructive" });
    toast({ title: "Tip received.", description: "Your submission is in the secure intake queue." });
  };

  return (
    <Layout>
      <section className="container py-12 max-w-3xl">
        <div className="stamp text-xs mb-4">Confidential Intake</div>
        <SectionHeading eyebrow="Whistleblower Portal" title="Submit a Tip. Securely.">
          Document-driven leads only. Public-interest review by the Lady Outlaw editorial team.
        </SectionHeading>

        <div className="bg-card border border-gold/40 p-6 mb-8 flex gap-4">
          <Shield className="h-6 w-6 text-gold shrink-0 mt-1" />
          <div className="text-sm text-muted-foreground font-typewriter leading-relaxed">
            <strong className="text-gold">Confidentiality Notice:</strong> We protect sources to the fullest extent allowed by law. Use an alias if needed. Do not include privileged or unlawfully obtained material. For maximum security, contact us via Signal — request the number through info@reelnewz.press.
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5 bg-card border border-border p-8">
          <div>
            <label className="font-stencil text-xs text-gold">Source name or alias</label>
            <Input required className="mt-1 bg-input" placeholder="Your name or chosen alias" />
          </div>
          <div>
            <label className="font-stencil text-xs text-gold">Preferred contact method</label>
            <Input required className="mt-1 bg-input" placeholder="Email, phone, Signal, ProtonMail..." />
          </div>
          <div>
            <label className="font-stencil text-xs text-gold">Category</label>
            <select required className="mt-1 w-full bg-input border border-border px-3 py-2 text-sm">
              <option>DCFS / CPS</option>
              <option>Family Court</option>
              <option>Government Corruption</option>
              <option>Judicial Misconduct</option>
              <option>Title IV-E / Contractor Capture</option>
              <option>Human Trafficking</option>
              <option>FOIA Obstruction</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="font-stencil text-xs text-gold">Summary of the matter</label>
            <Textarea required className="mt-1 bg-input min-h-32" placeholder="Be specific. Include dates, jurisdictions, names of public officials, and what records exist." />
          </div>
          <div>
            <label className="font-stencil text-xs text-gold flex items-center gap-2"><Upload className="h-3 w-3" /> Document upload (placeholder)</label>
            <div className="mt-1 border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground font-typewriter">
              Document upload integration available on request. For now, please email files to <span className="text-gold">tips@reelnewz.press</span>.
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-1" />
            <span className="text-muted-foreground font-typewriter">
              I confirm this submission is truthful to the best of my knowledge, made in the public interest, and not subject to a court order, NDA, or other legal restriction that I am unwilling to waive. I understand publication decisions remain editorial.
            </span>
          </label>
          <Button type="submit" size="lg" className="w-full bg-primary font-stencil shadow-blood"><Lock className="mr-2 h-4 w-4" /> Send Secure Tip</Button>
        </form>
      </section>
    </Layout>
  );
};

export default Tip;
