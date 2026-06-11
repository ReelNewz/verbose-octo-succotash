import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { COMPANY } from "@/lib/constants";

export function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Proudly serving {COMPANY.region}
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Marketing strategy &amp; growth tools for local businesses
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {COMPANY.name} helps Schaumburg-area businesses launch smarter campaigns, outmaneuver competitors,
            and turn ad spend into real revenue — backed by an AI-powered strategy and analytics dashboard.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="#contact">
                Get Your Free Strategy Session <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={user ? "/dashboard" : "/login"}>
                {user ? "Go to Dashboard" : "Client Login"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
