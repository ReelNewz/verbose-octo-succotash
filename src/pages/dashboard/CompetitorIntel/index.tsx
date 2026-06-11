import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "swot", label: "SWOT Analyzer", path: "/dashboard/competitor-intel/swot" },
  { value: "market-share", label: "Market Share", path: "/dashboard/competitor-intel/market-share" },
  { value: "keyword-gap", label: "Keyword Gap", path: "/dashboard/competitor-intel/keyword-gap" },
  { value: "social-ad-spy", label: "Social Ad Spy", path: "/dashboard/competitor-intel/social-ad-spy" },
];

export default function CompetitorIntel() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = TABS.find((tab) => location.pathname.startsWith(tab.path))?.value ?? "swot";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Competitor Intelligence</h1>
        <p className="text-muted-foreground">Research your competitors and find opportunities to win.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {
        const tab = TABS.find((t) => t.value === value);
        if (tab) navigate(tab.path);
      }}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Outlet />
    </div>
  );
}
