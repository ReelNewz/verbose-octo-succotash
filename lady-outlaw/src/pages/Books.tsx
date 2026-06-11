import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { BookOpen, Headphones, PenTool } from "lucide-react";
import books from "@/assets/books.jpg";

const BOOKS = [
  { title: "Stolen Without Verdict", subtitle: "An Investigative Memoir", price: "$24.99",
    synopsis: "A first-person account from inside the family-court / DCFS machine — the records, the rulings, and the receipts that built a national investigation." },
  { title: "A Bill", subtitle: "Constitutional Reform for the Forgotten", price: "$19.99",
    synopsis: "A legislative blueprint for restoring due process in dependency proceedings, written by a publisher who lived it." },
  { title: "Parent's Guide to Fighting Child Welfare Court", subtitle: "A Field Manual", price: "$29.99",
    synopsis: "Step-by-step strategies, document templates, and constitutional arguments for parents navigating dependency court." },
];

const Books = () => (
  <Layout>
    <section className="container py-12">
      <SectionHeading eyebrow="Bookstore" title="Books From the Front Lines.">
        Published by Redacted Nation™. Every page is sourced, cited, and built to outlast the news cycle.
      </SectionHeading>

      <div className="grid md:grid-cols-3 gap-8">
        {BOOKS.map((b, i) => (
          <div key={b.title} className="bg-card border border-border hover:border-gold transition-all flex flex-col">
            <div className="aspect-[3/4] bg-gunmetal relative overflow-hidden">
              <img src={books} alt={b.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-70" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="font-stencil text-[10px] text-gold">VOLUME {String(i + 1).padStart(2, "0")}</div>
                <div className="font-display text-xl font-black leading-tight">{b.title}</div>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <p className="font-typewriter text-xs text-primary">{b.subtitle}</p>
              <p className="text-sm text-muted-foreground mt-3 flex-1">{b.synopsis}</p>
              <div className="font-display text-2xl text-gold mt-4">{b.price}</div>
              <div className="flex flex-col gap-2 mt-4">
                <Button className="bg-primary font-stencil shadow-blood">Buy Now</Button>
                <Button variant="outline" className="font-stencil text-xs"><PenTool className="mr-2 h-3 w-3" /> Request Signed Copy</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-blood p-8">
          <Headphones className="h-8 w-8 text-primary-foreground" />
          <h3 className="font-display text-2xl font-black text-primary-foreground mt-3">Audiobooks</h3>
          <p className="text-primary-foreground/80 mt-2">Narrated by Kristian Nuzzo DeMito. Coming to all major platforms.</p>
        </div>
        <div className="bg-gradient-gold p-8">
          <BookOpen className="h-8 w-8 text-ink" />
          <h3 className="font-display text-2xl font-black text-ink mt-3">Podcast Companion Series</h3>
          <p className="text-ink/80 mt-2">Each chapter — unpacked, with the source documents, on Reel News With Nuzzo.</p>
        </div>
      </div>
    </section>
  </Layout>
);

export default Books;
