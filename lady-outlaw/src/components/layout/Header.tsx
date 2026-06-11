import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Crosshair, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const NAV = [
  { to: "/newsroom", label: "Newsroom" },
  { to: "/resources", label: "Resources" },
  { to: "/podcast", label: "Podcast" },
  { to: "/books", label: "Books" },
  { to: "/shop", label: "Shop" },
  { to: "/donate", label: "Donate" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-ink/95 backdrop-blur-md border-b border-border/60" : "bg-gradient-to-b from-ink/90 to-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-2 group">
          <Crosshair className="h-6 w-6 text-primary group-hover:rotate-180 transition-transform duration-700" />
          <div className="leading-none">
            <div className="font-display font-black text-lg md:text-xl tracking-widest">
              LADY <span className="text-primary">OUTLAW</span>
            </div>
            <div className="font-stencil text-[10px] text-muted-foreground">Redacted Nation™ · ReelNewz.Press</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `font-stencil text-xs tracking-widest transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-foreground/80"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm" className="font-stencil">
              <Link to="/admin"><Shield className="h-4 w-4 mr-1" /> Admin</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="border-gold text-gold hover:bg-gold hover:text-ink font-stencil">
            <Link to="/tip">Submit a Tip</Link>
          </Button>
        </div>

        <button className="lg:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-ink border-t border-border">
          <div className="container py-4 flex flex-col gap-3">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="font-stencil text-sm py-2 border-b border-border/40"
              >
                {n.label}
              </NavLink>
            ))}
            <Button asChild className="bg-primary mt-2 font-stencil">
              <Link to="/tip" onClick={() => setOpen(false)}>Submit a Tip</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
