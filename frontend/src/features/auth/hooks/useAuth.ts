import * as React from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * useAuth — custom hook for consuming authentication state and actions.
 *
 * Must be used inside a component tree wrapped by <AuthProvider>.
 * Throws a clear error if used outside the provider so bugs are caught early.
 *
 * @returns {AuthContextValue} The current auth state and action functions:
 *   - user:            The logged-in user (AuthUser) or null
 *   - isAuthenticated: Boolean shortcut for user !== null
 *   - isLoading:       True while the initial session restore is happening
 *   - login(data):     Authenticate with email + password
 *   - register(data):  Create account + auto-login
 *   - logout():        Clear session + redirect to /login
 *
 * @example
 *   const { user, logout } = useAuth()
 *   <button onClick={logout}>{user?.email}</button>
 */
export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Wrap your application or the relevant subtree with <AuthProvider>.'
    )
  }
  return context
}
