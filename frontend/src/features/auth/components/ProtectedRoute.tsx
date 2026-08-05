import * as React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * ProtectedRoute guards any route that requires authentication.
 *
 * Behavior:
 * - While the auth state is still initializing (reading localStorage on mount),
 *   renders a full-screen loading spinner to prevent a flash of the login page.
 * - If the user is NOT authenticated, redirects to /login.
 *   The 'replace' prop replaces the current history entry so pressing
 *   the browser back button after login doesn't go back to /login.
 * - If the user IS authenticated, renders the nested <Outlet /> (the actual page).
 *
 * Usage in App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard/*" element={<DashboardLayout />} />
 *   </Route>
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show a loading state while the context is initializing from localStorage.
  // Without this, users would see a flash redirect to /login on page refresh.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-page">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
          <p className="text-text-muted text-sm font-mono">Verifying session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
