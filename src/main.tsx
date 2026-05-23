import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LandingPage } from "@/pages/LandingPage";
import { AuditPage } from "@/pages/AuditPage";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AdminAccessPage } from "@/pages/AdminAccessPage";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/audit/:id" element={<AuditPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-access" element={<AdminAccessPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
