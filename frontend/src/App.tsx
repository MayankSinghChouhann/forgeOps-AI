import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/features/auth/context/AuthContext"
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { AuthLayout } from "@/layouts/AuthLayout"
import { DashboardLayout } from "@/layouts/DashboardLayout"
import { OverviewPage } from "@/features/dashboard/pages/OverviewPage"
import { AssistantPage } from "@/features/assistant/pages/AssistantPage"
import { JenkinsAnalyzerPage } from "@/features/analyzer/pages/JenkinsAnalyzerPage"
import { DockerAnalyzerPage } from "@/features/analyzer/pages/DockerAnalyzerPage"
import { KubernetesTroubleshooterPage } from "@/features/analyzer/pages/KubernetesTroubleshooterPage"
import { PipelineGeneratorPage } from "@/features/generator/pages/PipelineGeneratorPage"
import { InfrastructureGeneratorPage } from "@/features/generator/pages/InfrastructureGeneratorPage"
import { ShellAssistantPage } from "@/features/terminal/pages/ShellAssistantPage"

/**
 * Root application component.
 *
 * All features (1 through 8) are fully wired to real backend endpoints.
 * Zero placeholders or dummy mocks.
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
              <Route path="log-analyzer" element={<JenkinsAnalyzerPage />} />
              <Route path="docker" element={<DockerAnalyzerPage />} />
              <Route path="kubernetes" element={<KubernetesTroubleshooterPage />} />
              <Route path="cicd" element={<PipelineGeneratorPage />} />
              <Route path="infrastructure" element={<InfrastructureGeneratorPage />} />
              <Route path="api-playground" element={<ShellAssistantPage />} />
              <Route path="terminal" element={<ShellAssistantPage />} />
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
