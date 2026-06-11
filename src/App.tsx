import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import AdminAccessPage from "@/pages/AdminAccessPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

import DashboardLayoutPage from "@/pages/dashboard/DashboardLayoutPage";
import Overview from "@/pages/dashboard/Overview";
import Campaigns from "@/pages/dashboard/Campaigns";
import Leads from "@/pages/dashboard/Leads";
import AiStrategy from "@/pages/dashboard/AiStrategy";
import MetaAds from "@/pages/dashboard/MetaAds";
import LocalSeo from "@/pages/dashboard/LocalSeo";
import RoiCalculatorPage from "@/pages/dashboard/RoiCalculator";
import SettingsPage from "@/pages/dashboard/Settings";
import CompetitorIntel from "@/pages/dashboard/CompetitorIntel";
import SwotBuilder from "@/pages/dashboard/CompetitorIntel/SwotBuilder";
import MarketShare from "@/pages/dashboard/CompetitorIntel/MarketShare";
import KeywordGap from "@/pages/dashboard/CompetitorIntel/KeywordGap";
import SocialAdSpy from "@/pages/dashboard/CompetitorIntel/SocialAdSpy";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-access" element={<AdminAccessPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayoutPage />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="leads" element={<Leads />} />
            <Route path="ai-strategy" element={<AiStrategy />} />
            <Route path="meta-ads" element={<MetaAds />} />
            <Route path="local-seo" element={<LocalSeo />} />
            <Route path="competitor-intel" element={<CompetitorIntel />}>
              <Route index element={<SwotBuilder />} />
              <Route path="swot" element={<SwotBuilder />} />
              <Route path="market-share" element={<MarketShare />} />
              <Route path="keyword-gap" element={<KeywordGap />} />
              <Route path="social-ad-spy" element={<SocialAdSpy />} />
            </Route>
            <Route path="roi-calculator" element={<RoiCalculatorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}
