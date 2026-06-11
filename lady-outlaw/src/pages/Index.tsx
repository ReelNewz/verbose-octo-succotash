import { Link } from "react-router-dom";
import { ArrowRight, FileSearch, Shield, Download, Heart, ShoppingBag, Mic, Radio, Lock, Gavel, Scale } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/SectionHeading";
import hero from "@/assets/hero.jpg";
import courthouse from "@/assets/courthouse.jpg";
import podcast from "@/assets/podcast.jpg";
import books from "@/assets/books.jpg";

const CATEGORIES = [
  { icon: Shield, label: "DCFS / CPS" },
  { icon: Gavel, label: "Family Court" },
  { icon: Scale, label: "Constitutional Rights" },
  { icon: Lock, label: "FOIA Files" },
  { icon: Radio, label: "Whistleblowers" },
  { icon: FileSearch, label: "Judicial Accountability" },
];

const FEATURED = [
  { tag: "Illinois Watch", title: "Inside the Title IV-E Pipeline: Following the Money", date: "May 12, 2026" },
  { tag: "Family Court", title: "Contradiction Charts: 312 Hearings, One Pattern", date: "May 9, 2026" },
  { tag: "FOIA Files", title: "What the State Refused to Release — And Why", date: "May 4, 2026" },
];

const Index = () => {
  return (
    <Layout>
      <NewsletterPopup />

      {/* HERO */}
      <section className="relative -mt-24 md:-mt-28 min-h-[100vh] flex items-end overflow-hidden">
        <img src={hero} alt="Lady Outlaw cinematic hero" width={1920} height={1080} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 grain pointer-events-none" />
        <div className="container relative pb-20 md:pb-32 pt-40">
          <div className="max-w-3xl animate-fade-up">
            <div className="stamp text-xs mb-6">Unredacted · Unbroken · Unafraid</div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-balance">
              The News They <br />
              <span className="text-primary">Tried to Bury.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-bone/80 max-w-2xl font-typewriter">
              Independent investigative journalism. Constitutional accountability. Document-driven reporting from the front lines of the fight for truth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 font-stencil tracking-widest shadow-blood">
                <Link to="/newsroom">Read Investigations <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-ink font-stencil">
                <Link to="/tip">Submit a Tip</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-ink/40 backdrop-blur font-stencil">
                <Link to="/resources"><Download className="mr-2 h-4 w-4" /> Resources</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-ink/40 backdrop-blur font-stencil">
                <Link to="/donate"><Heart className="mr-2 h-4 w-4" /> Support</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-ink/40 backdrop-blur font-stencil">
                <Link to="/shop"><ShoppingBag className="mr-2 h-4 w-4" /> Shop</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border bg-ink/40 backdrop-blur font-stencil">
                <Link to="/podcast"><Mic className="mr-2 h-4 w-4" /> Listen</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section className="border-y border-border bg-ink py-8">
        <div className="container grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {CATEGORIES.map((c) => (
            <Link to="/newsroom" key={c.label} className="group flex flex-col items-center text-center gap-2">
              <c.icon className="h-7 w-7 text-gold group-hover:text-primary transition-colors" />
              <span className="font-stencil text-xs">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED INVESTIGATIONS */}
      <section className="container py-20">
        <SectionHeading eyebrow="Featured Investigations" title="Records. Receipts. Reckonings.">
          Document-driven reporting on the institutions that profit from silence.
        </SectionHeading>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURED.map((f, i) => (
            <Link key={i} to="/newsroom" className="group relative bg-card border border-border hover:border-primary transition-all duration-500 overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-gunmetal relative">
                <img
                  src={i === 0 ? courthouse : i === 1 ? hero : podcast}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute top-3 left-3 stamp text-[10px]">{f.tag}</div>
              </div>
              <div className="p-6">
                <p className="font-typewriter text-xs text-muted-foreground mb-2">{f.date}</p>
                <h3 className="font-display text-xl font-bold leading-tight group-hover:text-primary transition-colors">{f.title}</h3>
                <div className="mt-4 font-stencil text-xs text-gold flex items-center gap-2">Read File <ArrowRight className="h-3 w-3" /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MISSION BLOCK */}
      <section className="relative py-24 overflow-hidden">
        <img src={courthouse} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
        <div className="container relative grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="font-stencil text-xs text-gold mb-3">— The Mission</div>
            <h2 className="font-display text-4xl md:text-5xl font-black leading-tight">
              A newsroom built for what the system <span className="text-primary">won't print</span>.
            </h2>
            <p className="text-muted-foreground mt-6 text-lg">
              Lady Outlaw™ is the feminine rebellion arm of Redacted Nation™ — investigating DCFS contractor capture, Title IV-E funding, family court bias, and the constitutional violations buried beneath them.
            </p>
            <Button asChild size="lg" className="mt-8 bg-primary font-stencil shadow-blood">
              <Link to="/about">Meet Kristian Nuzzo DeMito</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { n: "1,200+", l: "FOIA Requests Filed" },
              { n: "47", l: "Investigations Live" },
              { n: "312", l: "Hearings Reviewed" },
              { n: "100%", l: "Reader-Funded" },
            ].map((s) => (
              <div key={s.l} className="bg-card border border-border p-6">
                <div className="font-display text-3xl text-gold font-black">{s.n}</div>
                <div className="font-stencil text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PODCAST + BOOKS */}
      <section className="container py-20 grid md:grid-cols-2 gap-8">
        <Link to="/podcast" className="group relative aspect-[4/3] overflow-hidden border border-border">
          <img src={podcast} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <div className="font-stencil text-xs text-primary mb-2">— Podcast</div>
            <h3 className="font-display text-3xl font-black">Reel News With Nuzzo</h3>
            <p className="text-muted-foreground mt-2">Long-form investigative interviews & whistleblower transcripts.</p>
          </div>
        </Link>
        <Link to="/books" className="group relative aspect-[4/3] overflow-hidden border border-border">
          <img src={books} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <div className="font-stencil text-xs text-gold mb-2">— Bookstore</div>
            <h3 className="font-display text-3xl font-black">Stolen Without Verdict</h3>
            <p className="text-muted-foreground mt-2">Books, signed copies & audiobooks from the front lines.</p>
          </div>
        </Link>
      </section>

      {/* CTA BAND */}
      <section className="relative py-20 bg-gradient-blood overflow-hidden">
        <div className="absolute inset-0 grain" />
        <div className="container relative text-center">
          <h2 className="font-display text-4xl md:text-6xl font-black text-primary-foreground">Help Fund the Fight for Truth.</h2>
          <p className="mt-4 text-primary-foreground/90 max-w-2xl mx-auto">Every dollar funds FOIA filings, document review, investigative travel, and whistleblower intake.</p>
          <Button asChild size="lg" className="mt-8 bg-ink text-bone hover:bg-ink/80 font-stencil tracking-widest">
            <Link to="/donate">Support the Mission</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
