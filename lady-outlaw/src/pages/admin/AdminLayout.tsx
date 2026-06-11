import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Tag, LogOut, Crosshair, Folder, Download } from "lucide-react";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/articles", label: "Articles", icon: FileText },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/resources", label: "Resources", icon: Folder },
  { to: "/admin/downloads", label: "Downloads", icon: Download },
];

export default function AdminLayout() {
  const nav = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    nav("/auth");
  };

  return (
    <div className="min-h-screen flex bg-ink text-foreground">
      <aside className="w-60 border-r border-border bg-card flex flex-col">
        <Link to="/" className="flex items-center gap-2 p-4 border-b border-border">
          <Crosshair className="h-5 w-5 text-primary" />
          <span className="font-display font-black tracking-widest text-sm">LADY <span className="text-primary">OUTLAW</span></span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 font-stencil text-xs tracking-widest border-l-2 transition-colors ${
                  isActive ? "border-primary bg-primary/10 text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`
              }
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start font-stencil text-xs">
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
