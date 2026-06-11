import { MapPin, Phone, Clock } from "lucide-react";
import { COMPANY, MAP_EMBED_SRC } from "@/lib/constants";

export function LocalSeoSection() {
  return (
    <section id="local-seo" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Dominate local search</h2>
          <p className="mt-4 text-muted-foreground">
            We help businesses across {COMPANY.region} rank higher on Google Maps and local search results.
            From Google Business Profile optimization to localized content and review generation, our Local
            SEO services make sure customers find you first.
          </p>

          <dl className="mt-8 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <dt className="font-medium">Visit Us</dt>
                <dd className="text-sm text-muted-foreground">{COMPANY.fullAddress}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <dt className="font-medium">Call Us</dt>
                <dd className="text-sm text-muted-foreground">{COMPANY.phone}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <dt className="font-medium">Hours</dt>
                <dd className="text-sm text-muted-foreground">{COMPANY.hoursWeekday} &middot; {COMPANY.hoursSaturday}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="overflow-hidden rounded-lg border shadow-sm">
          <iframe
            title="NexaMarketing Consulting Group location"
            src={MAP_EMBED_SRC}
            className="h-80 w-full border-0 sm:h-96"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
