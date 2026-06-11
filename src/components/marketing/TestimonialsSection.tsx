import { Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TESTIMONIALS } from "@/lib/constants";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">What local businesses say</h2>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial) => (
          <Card key={testimonial.name}>
            <CardContent className="pt-6">
              <Quote className="h-6 w-6 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">"{testimonial.quote}"</p>
              <p className="mt-4 font-semibold">{testimonial.name}</p>
              <p className="text-sm text-muted-foreground">{testimonial.business}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
