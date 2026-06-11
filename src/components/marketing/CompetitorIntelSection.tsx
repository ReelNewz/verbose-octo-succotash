import { Link } from "react-router-dom";
import { PieChart, Search, Eye, Target, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { COMPETITOR_INTEL_TOOLS } from "@/lib/constants";

const ICONS: Record<string, typeof PieChart> = {
  swot: Target,
  "market-share": PieChart,
  "keyword-gap": Search,
  "social-ad-spy": Eye,
};

export function CompetitorIntelSection() {
  const { user } = useAuth();

  return (
    <section id="competitor-intel" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Know your competition</h2>
        <p className="mt-4 text-muted-foreground">
          Our Competitor Intelligence suite gives you the insights to outmaneuver competitors in your local
          market — available right inside your client dashboard.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {COMPETITOR_INTEL_TOOLS.map((tool) => {
          const Icon = ICONS[tool.id] ?? Target;
          return (
            <Card key={tool.id} className="flex flex-col">
              <CardHeader>
                <Icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-lg">{tool.name}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="outline" className="w-full">
                  <Link to={user ? tool.route : "/login"}>
                    {user ? (
                      "Open Tool"
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" /> Sign in to access
                      </>
                    )}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
