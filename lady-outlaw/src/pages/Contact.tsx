import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Newspaper, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CONTACTS = [
  { icon: Lock, label: "Confidential Tips", value: "tips@reelnewz.press" },
  { icon: Newspaper, label: "Press & Media", value: "press@reelnewz.press" },
  { icon: Mail, label: "General Inquiries", value: "info@reelnewz.press" },
  { icon: Phone, label: "Newsroom Line", value: "(630) 448-2355" },
];

const Contact = () => {
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Message received.", description: "The newsroom will respond shortly." });
  };

  return (
    <Layout>
      <section className="container py-12 max-w-5xl">
        <SectionHeading eyebrow="Contact" title="Reach the Newsroom." />
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            {CONTACTS.map(c => (
              <div key={c.label} className="bg-card border border-border hover:border-gold transition-all p-5 flex items-center gap-4">
                <c.icon className="h-6 w-6 text-gold shrink-0" />
                <div>
                  <div className="font-stencil text-xs text-primary">{c.label}</div>
                  <div className="font-display text-lg">{c.value}</div>
                </div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground font-typewriter mt-4">
              For high-sensitivity sources, request a Signal contact via info@reelnewz.press.
            </div>
          </div>

          <form onSubmit={submit} className="bg-card border border-border p-6 space-y-4">
            <Input required placeholder="Name" className="bg-input" />
            <Input required type="email" placeholder="Email" className="bg-input" />
            <Input placeholder="Subject" className="bg-input" />
            <Textarea required placeholder="Message" className="bg-input min-h-32" />
            <Button type="submit" className="w-full bg-primary font-stencil shadow-blood">Send Message</Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
