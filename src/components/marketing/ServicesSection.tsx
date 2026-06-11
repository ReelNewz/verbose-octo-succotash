import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { REVENUE_MODELS } from "@/lib/constants";

export function ServicesSection() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Services built around your growth</h2>
        <p className="mt-4 text-muted-foreground">
          Whether you need a one-time strategy sprint or an ongoing growth partner, we have a model that fits
          your business and your budget.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {REVENUE_MODELS.map((model) => (
          <Card key={model.id} className={model.highlight ? "border-primary shadow-md" : undefined}>
            <CardHeader>
              {model.highlight && <Badge className="mb-2 w-fit">Most Popular</Badge>}
              <CardTitle className="text-xl">{model.name}</CardTitle>
              <p className="text-2xl font-bold">
                {model.price}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ {model.cadence}</span>
              </p>
              <CardDescription>{model.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {model.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
