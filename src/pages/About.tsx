import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, Mic, Newspaper, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import hero from "@/assets/hero.jpg";

const TIMELINE = [
  { year: "2019", text: "First public filings: family court records, FOIA appeals." },
  { year: "2021", text: "Founded Redacted Nation™ — independent investigative imprint." },
  { year: "2023", text: "Launched ReelNewz.Press and Reel News With Nuzzo podcast." },
  { year: "2024", text: "Published Stolen Without Verdict and the Parent's Guide field manual." },
  { year: "2026", text: "Lady Outlaw™ launches as the feminine rebellion arm of the platform." },
];

const CREDENTIALS = [
  { icon: Newspaper, label: "Investigative journalist & publisher" },
  { icon: BookOpen, label: "Author of three investigative titles" },
  { icon: Mic, label: "Host, Reel News With Nuzzo" },
  { icon: Scale, label: "Constitutional accountability advocate" },
  { icon: Award, label: "FOIA practitioner & document analyst" },
];

const About = () => (
  <Layout>
    <section className="relative py-20 overflow-hidden">
      <img src={hero} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
      <div className="container relative max-w-4xl">
        <div className="stamp text-xs mb-4">The Founder</div>
        <h1 className="font-display text-5xl md:text-7xl font-black leading-tight">
          Kristian Nuzzo <span className="text-primary">DeMito</span>
        </h1>
        <p className="text-xl text-bone/80 mt-6 max-w-2xl font-typewriter">
          Founder · Publisher · Investigative Journalist · Author · Constitutional Advocate · Creator of Redacted Nation™ and ReelNewz.Press.
        </p>
      </div>
    </section>

    <section className="container py-16 max-w-4xl">
      <SectionHeading eyebrow="The Mission" title="Built from the inside. Reported from the front." />
      <div className="prose prose-invert max-w-none text-muted-foreground space-y-4 font-body">
        <p>Lady Outlaw™ exists because the institutions designed to protect families have, in too many cases, become the institutions that profit from breaking them. After years inside the family-court / DCFS machine — and thousands of pages of records to prove it — Kristian built a publishing platform from the only thing the system couldn't redact: documents.</p>
        <p>Redacted Nation™ is the publisher. ReelNewz.Press is the newsroom. Reel News With Nuzzo is the broadcast. Lady Outlaw™ is the feminine rebellion arm — outlaw Americana for parents, patriots, and press who refuse to be silent.</p>
        <p>Every investigation is anchored in records. Every allegation is reviewed through public documents and right-of-reply practices. Every dollar raised funds the next FOIA, the next filing, the next story they tried to bury.</p>
      </div>

      <h2 className="font-display text-3xl font-black mt-16 mb-6">Credentials</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {CREDENTIALS.map(c => (
          <div key={c.label} className="bg-card border border-border p-4 flex items-center gap-3">
            <c.icon className="h-5 w-5 text-gold shrink-0" />
            <span className="text-sm">{c.label}</span>
          </div>
        ))}
      </div>

      <h2 className="font-display text-3xl font-black mt-16 mb-6">Mission Timeline</h2>
      <div className="border-l-2 border-primary pl-6 space-y-6">
        {TIMELINE.map(t => (
          <div key={t.year}>
            <div className="font-display text-2xl text-gold">{t.year}</div>
            <p className="text-muted-foreground mt-1">{t.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-gradient-blood p-8 text-center">
        <h3 className="font-display text-2xl font-black text-primary-foreground">Press Inquiries</h3>
        <p className="text-primary-foreground/80 mt-2">Interview requests, panels, and editorial collaborations.</p>
        <Button asChild size="lg" className="mt-6 bg-ink text-bone font-stencil"><Link to="/contact">Contact Press Desk</Link></Button>
      </div>
    </section>
  </Layout>
);

export default About;
