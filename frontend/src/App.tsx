import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/features/auth/context/AuthContext"
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { AuthLayout } from "@/layouts/AuthLayout"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { OverviewPage } from "@/features/dashboard/pages/OverviewPage"
import { AssistantPage } from "@/features/assistant/pages/AssistantPage"

/**
 * Root application component.
 *
 * Route structure:
 * - Public routes (/login, /register) are wrapped by AuthLayout
 * - Protected routes (/dashboard/*) are wrapped by ProtectedRoute,
 *   which redirects unauthenticated users to /login
 *
 * AuthProvider must be inside BrowserRouter because it uses
 * useNavigate() internally (which requires the Router context).
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Dashboard Routes — requires authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard/overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="log-analyzer" element={<div className="text-text-primary p-6">Log Analyzer — Coming Soon</div>} />
              <Route path="docker" element={<div className="text-text-primary p-6">Docker Analyzer — Coming Soon</div>} />
              <Route path="kubernetes" element={<div className="text-text-primary p-6">Kubernetes Troubleshooter — Coming Soon</div>} />
              <Route path="cicd" element={<div className="text-text-primary p-6">CI/CD Pipeline — Coming Soon</div>} />
              <Route path="infrastructure" element={<div className="text-text-primary p-6">Infrastructure — Coming Soon</div>} />
              <Route path="api-playground" element={<div className="text-text-primary p-6">API Playground — Coming Soon</div>} />
              <Route path="settings" element={<div className="text-text-primary p-6">Settings — Coming Soon</div>} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
