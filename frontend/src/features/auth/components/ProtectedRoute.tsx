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
      <div className="flex h-screen items-center justify-center bg-page" role="status">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm text-text-muted">Verifying session…</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
