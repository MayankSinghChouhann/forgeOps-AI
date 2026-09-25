import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { clearAccessToken, getAccessToken, setAccessToken } from '../tokenStore'
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth.types'

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
}

// ─── Context Creation ─────────────────────────────────────────────────────────

/**
 * AuthContext is the global store for authentication state.
 * It is consumed via the `useAuth` hook — components should NOT
 * import AuthContext directly; always use the hook.
 */
export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

function clearSession() {
  clearAccessToken()
  // Remove tokens left by versions released before refresh cookies were adopted.
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userEmail')
}

function getTokenExpiry(accessToken: string): number | null {
  try {
    const payload = accessToken.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = JSON.parse(atob(padded)) as { exp?: number }
    return decoded.exp ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * AuthProvider manages the global authentication state.
 *
 * On mount, it restores the user session through the HttpOnly refresh cookie.
 * It provides login, register,
 * and logout actions to all child components via AuthContext.
 *
 * Wrap the root of the application with this provider.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const refreshSession = React.useCallback(async () => {
    const response = await authApi.refreshToken()
    setAccessToken(response.accessToken)
    setUser({ email: response.email })
    return response.accessToken
  }, [])

  React.useEffect(() => {
    clearSession()
    refreshSession()
      .catch(() => {
        clearSession()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [refreshSession])

  React.useEffect(() => {
    if (!user) return
    const accessToken = getAccessToken()
    if (!accessToken) return
    const expiresAt = getTokenExpiry(accessToken)
    if (!expiresAt) return

    const refreshIn = Math.max(0, expiresAt - Date.now() - 60_000)
    const timer = window.setTimeout(() => {
      refreshSession().catch(() => {
        clearSession()
        setUser(null)
        navigate('/login')
      })
    }, refreshIn)
    return () => window.clearTimeout(timer)
  }, [user, refreshSession, navigate])

  /**
   * Authenticate with email + password.
   * On success: keeps the access token in memory, updates user state,
   * and navigates to the dashboard.
   */
  const login = React.useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data)
    setAccessToken(response.accessToken)
    setUser({ email: response.email })
    navigate('/dashboard/overview')
  }, [navigate])

  /**
   * Register a new account, then automatically log the user in.
   * The backend register endpoint returns a plain string (not tokens),
   * so we call login() immediately after successful registration.
   */
  const register = React.useCallback(async (data: RegisterRequest) => {
    await authApi.register(data)
    // Auto-login after successful registration
    await login(data)
  }, [login])

  /**
   * Log the user out by revoking the cookie-backed session and clearing memory.
   */
  const logout = React.useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Local logout must still succeed if the cookie is already invalid.
    }
    clearSession()
    setUser(null)
    navigate('/login')
  }, [navigate])

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
