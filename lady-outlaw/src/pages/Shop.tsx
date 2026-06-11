import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Star, Flame, Timer } from "lucide-react";

const COLLECTIONS = ["All", "Lady Outlaw Signature", "No More Kings", "Save the Children", "Constitutional Rebel", "Redacted Nation", "Truth Rides Armed", "Unredacted Patriot"];

const PRODUCTS = [
  { name: "Lady Outlaw Tee — Crimson", collection: "Lady Outlaw Signature", price: 32, tag: "Bestseller", reviews: 4.9 },
  { name: "Unredacted Hoodie — Matte Black", collection: "Unredacted Patriot", price: 64, tag: "Limited", reviews: 5.0 },
  { name: "No More Kings Cap", collection: "No More Kings", price: 28, tag: null, reviews: 4.8 },
  { name: "Save the Children Pin Set", collection: "Save the Children", price: 18, tag: "Bestseller", reviews: 4.9 },
  { name: "Constitutional Rebel Bandana", collection: "Constitutional Rebel", price: 22, tag: null, reviews: 4.7 },
  { name: "Redacted Nation Field Jacket", collection: "Redacted Nation", price: 128, tag: "Limited", reviews: 5.0 },
  { name: "Truth Rides Armed Patch", collection: "Truth Rides Armed", price: 12, tag: null, reviews: 4.8 },
  { name: "Outlaw Press Mug", collection: "Lady Outlaw Signature", price: 19, tag: null, reviews: 4.7 },
];

const Shop = () => {
  const [col, setCol] = useState("All");
  const [time, setTime] = useState({ d: 3, h: 14, m: 22, s: 41 });

  useEffect(() => {
    const t = setInterval(() => setTime(p => {
      let { d, h, m, s } = p; s--;
      if (s < 0) { s = 59; m--; }
      if (m < 0) { m = 59; h--; }
      if (h < 0) { h = 23; d--; }
      return { d, h, m, s };
    }), 1000);
    return () => clearInterval(t);
  }, []);

  const filtered = PRODUCTS.filter(p => col === "All" || p.collection === col);

  return (
    <Layout>
      <section className="container py-12">
        <SectionHeading eyebrow="The Outlaw Outfit" title="Wear the Mission.">
          Premium apparel for patriots, parents, and press. Every order funds investigations.
        </SectionHeading>

        {/* Limited edition countdown */}
        <div className="bg-gradient-blood p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-primary-foreground">
            <Flame className="h-6 w-6" />
            <div>
              <div className="font-stencil text-xs">Limited Drop</div>
              <div className="font-display text-xl font-black">Redacted Nation Field Jacket — Restock</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-primary-foreground">
            <Timer className="h-5 w-5" />
            {(["d","h","m","s"] as const).map(k => (
              <div key={k} className="bg-ink/40 px-3 py-2 font-display text-2xl font-black w-14 text-center">{String(time[k]).padStart(2,"0")}<span className="block text-[8px] font-stencil">{k}</span></div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {COLLECTIONS.map(c => (
            <button key={c} onClick={() => setCol(c)} className={`font-stencil text-xs px-3 py-1.5 border ${col === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>{c}</button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(p => (
            <div key={p.name} className="group bg-card border border-border hover:border-gold transition-all">
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gunmetal to-ink">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShoppingBag className="h-16 w-16 text-primary/20 group-hover:scale-110 transition-transform" />
                </div>
                {p.tag && <div className="absolute top-3 left-3 stamp text-[10px]">{p.tag}</div>}
              </div>
              <div className="p-4">
                <div className="font-stencil text-[10px] text-primary">{p.collection}</div>
                <h3 className="font-display font-bold mt-1 leading-tight">{p.name}</h3>
                <div className="flex items-center gap-1 mt-2 text-gold text-xs">
                  <Star className="h-3 w-3 fill-current" /> {p.reviews}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-display text-xl text-gold">${p.price}</span>
                  <Button size="sm" className="bg-primary font-stencil text-xs">Add</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center font-typewriter text-xs text-muted-foreground">
          Stripe & PayPal checkout integration ready · Secure cart · Worldwide shipping
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
