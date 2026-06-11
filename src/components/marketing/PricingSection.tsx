import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { REVENUE_MODELS } from "@/lib/constants";

export function PricingSection() {
  return (
    <section id="pricing" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">
            Choose the plan that fits where your business is today — upgrade or change anytime.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REVENUE_MODELS.map((model) => (
            <Card key={model.id} className={`flex flex-col ${model.highlight ? "border-primary shadow-md" : ""}`}>
              <CardHeader>
                {model.highlight && <Badge className="mb-2 w-fit">Most Popular</Badge>}
                <CardTitle className="text-xl">{model.name}</CardTitle>
                <p className="text-3xl font-bold">
                  {model.price}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">/ {model.cadence}</span>
                </p>
                <CardDescription>{model.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {model.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant={model.highlight ? "default" : "outline"}>
                  <a href="#contact">Choose {model.name}</a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
