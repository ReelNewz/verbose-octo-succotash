import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import "@/index.css";

function LoginPage() {
  return <div className="flex h-screen items-center justify-center"><p>Login page</p></div>;
}

function DashboardPage() {
  return <div className="flex h-screen items-center justify-center"><p>Dashboard (authenticated)</p></div>;
}

function AdminPage() {
  return <div className="flex h-screen items-center justify-center"><p>Admin panel</p></div>;
}

function AdminAccessPage() {
  return <div className="flex h-screen items-center justify-center"><p>Request admin access</p></div>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-access" element={<AdminAccessPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Link to="/dashboard">Go to dashboard</Link>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
