import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SAMPLE_ADS = [
  {
    headline: "Spring Cleaning Special — 20% Off",
    body: "Book your deep clean this week and save 20%. Limited spots available in Schaumburg & Hoffman Estates.",
    likes: 142,
    comments: 18,
    shares: 9,
  },
  {
    headline: "Now Accepting New Patients",
    body: "Same-week appointments available. Most insurance accepted. Call today to schedule your visit.",
    likes: 86,
    comments: 7,
    shares: 4,
  },
];

const STATS = [
  { label: "Avg. Click-Through Rate", value: "2.1%" },
  { label: "Avg. Cost per Lead", value: "$18.40" },
  { label: "Avg. Reach per Campaign", value: "32K+" },
];

export function MetaAdsSection() {
  return (
    <section id="meta-ads" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Facebook &amp; Instagram Ads that convert</h2>
          <p className="mt-4 text-muted-foreground">
            We design, launch, and optimize Meta ad campaigns that turn scrollers into customers — with full
            transparency on spend and results.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {SAMPLE_ADS.map((ad) => (
            <Card key={ad.headline} className="overflow-hidden">
              <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary/20 to-primary/5" />
              <CardHeader>
                <CardTitle className="text-lg">{ad.headline}</CardTitle>
                <CardDescription>{ad.body}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><ThumbsUp className="h-4 w-4" /> {ad.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" /> {ad.comments}</span>
                  <span className="flex items-center gap-1"><Share2 className="h-4 w-4" /> {ad.shares}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 rounded-lg border bg-background p-6 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
