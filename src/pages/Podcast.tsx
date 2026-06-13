import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Play, Mic, Headphones } from "lucide-react";
import podcast from "@/assets/podcast.jpg";

const EPISODES = [
  { n: "EP 047", title: "Inside the Title IV-E Pipeline", date: "May 12, 2026", desc: "How federal reimbursements drive removals." },
  { n: "EP 046", title: "Whistleblower: A Caseworker's Account", date: "May 5, 2026", desc: "On-record from inside the agency." },
  { n: "EP 045", title: "Family Court Bias: 312 Hearings", date: "Apr 28, 2026", desc: "Six months of transcripts. One pattern." },
  { n: "EP 044", title: "FOIA Obstruction in Illinois", date: "Apr 21, 2026", desc: "What the state refuses to release." },
  { n: "EP 043", title: "Constitutional Rights in Family Court", date: "Apr 14, 2026", desc: "What every parent needs to know." },
  { n: "EP 042", title: "The Contractor Capture Files", date: "Apr 7, 2026", desc: "Private providers, public power." },
];

const Podcast = () => (
  <Layout>
    <section className="relative -mt-8 py-20 overflow-hidden">
      <img src={podcast} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
      <div className="container relative">
        <div className="stamp text-xs mb-4">On Air</div>
        <h1 className="font-display text-5xl md:text-7xl font-black">Reel News <span className="text-primary">With Nuzzo</span></h1>
        <p className="text-muted-foreground mt-4 max-w-xl text-lg">Long-form investigative interviews, whistleblower transcripts, and cinematic reporting on the institutions that profit from silence.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" className="bg-primary font-stencil shadow-blood"><Play className="mr-2 h-4 w-4" /> Latest Episode</Button>
          <Button size="lg" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-ink font-stencil"><Headphones className="mr-2 h-4 w-4" /> Subscribe</Button>
          <Button size="lg" variant="outline" className="font-stencil"><Mic className="mr-2 h-4 w-4" /> Be a Guest</Button>
        </div>
      </div>
    </section>

    <section className="container py-12">
      <SectionHeading eyebrow="Episodes" title="The Full Catalog." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EPISODES.map(ep => (
          <article key={ep.n} className="bg-card border border-border hover:border-primary transition-all">
            <div className="aspect-video bg-gunmetal relative overflow-hidden">
              <img src={podcast} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-50" />
              <button className="absolute inset-0 flex items-center justify-center group">
                <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center shadow-blood group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-primary-foreground ml-1" />
                </div>
              </button>
            </div>
            <div className="p-5">
              <div className="font-stencil text-xs text-gold">{ep.n} · {ep.date}</div>
              <h3 className="font-display text-lg font-bold mt-1">{ep.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{ep.desc}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="font-stencil text-[10px]">Transcript</Button>
                <Button size="sm" variant="outline" className="font-stencil text-[10px]">Show Notes</Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 bg-gradient-blood p-10 text-center">
        <h3 className="font-display text-3xl font-black text-primary-foreground">Got a story the system buried?</h3>
        <p className="text-primary-foreground/80 mt-2">Pitch a guest spot or send a confidential lead.</p>
        <Button size="lg" className="mt-6 bg-ink text-bone font-stencil">Guest Intake Form</Button>
      </div>
    </section>
  </Layout>
);

export default Podcast;
