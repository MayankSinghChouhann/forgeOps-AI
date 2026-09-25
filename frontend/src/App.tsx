import * as React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "@/features/auth/context/AuthContext"
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { AuthLayout } from "@/layouts/AuthLayout"
import { DashboardLayout } from "@/layouts/DashboardLayout"
const OverviewPage = React.lazy(() => import("@/features/dashboard/pages/OverviewPage").then((module) => ({ default: module.OverviewPage })))
const AssistantPage = React.lazy(() => import("@/features/assistant/pages/AssistantPage").then((module) => ({ default: module.AssistantPage })))
const JenkinsAnalyzerPage = React.lazy(() => import("@/features/analyzer/pages/JenkinsAnalyzerPage").then((module) => ({ default: module.JenkinsAnalyzerPage })))
const DockerAnalyzerPage = React.lazy(() => import("@/features/analyzer/pages/DockerAnalyzerPage").then((module) => ({ default: module.DockerAnalyzerPage })))
const KubernetesTroubleshooterPage = React.lazy(() => import("@/features/analyzer/pages/KubernetesTroubleshooterPage").then((module) => ({ default: module.KubernetesTroubleshooterPage })))
const PipelineGeneratorPage = React.lazy(() => import("@/features/generator/pages/PipelineGeneratorPage").then((module) => ({ default: module.PipelineGeneratorPage })))
const InfrastructureGeneratorPage = React.lazy(() => import("@/features/generator/pages/InfrastructureGeneratorPage").then((module) => ({ default: module.InfrastructureGeneratorPage })))
const ShellAssistantPage = React.lazy(() => import("@/features/terminal/pages/ShellAssistantPage").then((module) => ({ default: module.ShellAssistantPage })))
const SettingsPage = React.lazy(() => import("@/features/settings/pages/SettingsPage").then((module) => ({ default: module.SettingsPage })))

function PageLoader() {
  return <div className="flex min-h-64 items-center justify-center text-sm text-text-muted" role="status">Loading workspace…</div>
}

function lazyPage(page: React.ReactNode) {
  return <React.Suspense fallback={<PageLoader />}>{page}</React.Suspense>
}

/**
 * Root application component.
 * Routes the authenticated dashboard and public auth flows.
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
              <Route path="overview" element={lazyPage(<OverviewPage />)} />
              <Route path="assistant" element={lazyPage(<AssistantPage />)} />
              <Route path="log-analyzer" element={lazyPage(<JenkinsAnalyzerPage />)} />
              <Route path="docker" element={lazyPage(<DockerAnalyzerPage />)} />
              <Route path="kubernetes" element={lazyPage(<KubernetesTroubleshooterPage />)} />
              <Route path="cicd" element={lazyPage(<PipelineGeneratorPage />)} />
              <Route path="infrastructure" element={lazyPage(<InfrastructureGeneratorPage />)} />
              <Route path="api-playground" element={lazyPage(<ShellAssistantPage />)} />
              <Route path="terminal" element={lazyPage(<ShellAssistantPage />)} />
              <Route path="settings" element={lazyPage(<SettingsPage />)} />
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
