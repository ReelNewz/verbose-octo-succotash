import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { COMPANY } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-bold">
              <TrendingUp className="h-5 w-5 text-primary" />
              {COMPANY.name}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Marketing strategy, advertising, and competitor intelligence for businesses across {COMPANY.region}.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#services" className="hover:text-foreground">Services</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#testimonials" className="hover:text-foreground">Testimonials</a></li>
              <li><a href="#contact" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Tools</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><a href="#ai-strategy" className="hover:text-foreground">AI Strategy Generator</a></li>
              <li><a href="#roi-calculator" className="hover:text-foreground">ROI Calculator</a></li>
              <li><a href="#competitor-intel" className="hover:text-foreground">Competitor Intelligence</a></li>
              <li><Link to="/login" className="hover:text-foreground">Client Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>{COMPANY.fullAddress}</li>
              <li>{COMPANY.phone}</li>
              <li>{COMPANY.email}</li>
              <li>{COMPANY.hoursWeekday}</li>
              <li>{COMPANY.hoursSaturday}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
