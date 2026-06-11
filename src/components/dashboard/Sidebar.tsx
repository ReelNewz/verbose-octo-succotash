import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Sparkles,
  Facebook,
  MapPin,
  Target,
  Calculator,
  Settings,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/dashboard/leads", label: "Leads", icon: Users },
  { to: "/dashboard/ai-strategy", label: "AI Strategy", icon: Sparkles },
  { to: "/dashboard/meta-ads", label: "Meta Ads", icon: Facebook },
  { to: "/dashboard/local-seo", label: "Local SEO", icon: MapPin },
  { to: "/dashboard/competitor-intel", label: "Competitor Intel", icon: Target },
  { to: "/dashboard/roi-calculator", label: "ROI Calculator", icon: Calculator },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4 font-bold">
        <TrendingUp className="h-6 w-6 text-sidebar-primary" />
        NexaMarketing
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
