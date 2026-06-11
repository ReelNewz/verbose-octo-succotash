import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { COMPANY } from "@/lib/constants";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#ai-strategy", label: "AI Strategy" },
  { href: "#local-seo", label: "Local SEO" },
  { href: "#meta-ads", label: "Meta Ads" },
  { href: "#competitor-intel", label: "Competitor Intel" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

export function Nav() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{COMPANY.name}</span>
          <span className="sm:hidden">NexaMarketing</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Button asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <a href="#contact">Get Started</a>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t bg-background lg:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <Button asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button asChild>
                    <a href="#contact" onClick={() => setOpen(false)}>Get Started</a>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
