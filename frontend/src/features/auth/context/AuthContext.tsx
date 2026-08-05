import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth.types'

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

// ─── Context Creation ─────────────────────────────────────────────────────────

/**
 * AuthContext is the global store for authentication state.
 * It is consumed via the `useAuth` hook — components should NOT
 * import AuthContext directly; always use the hook.
 */
export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const TOKEN_KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
  EMAIL: 'userEmail',
} as const

function saveSession(accessToken: string, refreshToken: string, email: string) {
  localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken)
  localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken)
  localStorage.setItem(TOKEN_KEYS.EMAIL, email)
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEYS.ACCESS)
  localStorage.removeItem(TOKEN_KEYS.REFRESH)
  localStorage.removeItem(TOKEN_KEYS.EMAIL)
}

function getStoredUser(): AuthUser | null {
  const email = localStorage.getItem(TOKEN_KEYS.EMAIL)
  const token = localStorage.getItem(TOKEN_KEYS.ACCESS)
  if (email && token) return { email }
  return null
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * AuthProvider manages the global authentication state.
 *
 * On mount, it restores the user session from localStorage so the user
 * stays logged in after a page refresh. It provides login, register,
 * and logout actions to all child components via AuthContext.
 *
 * Wrap the root of the application with this provider.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  // Restore session from localStorage on initial mount
  React.useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser) {
      setUser(storedUser)
    }
    setIsLoading(false)
  }, [])

  /**
   * Authenticate with email + password.
   * On success: saves tokens to localStorage, updates user state,
   * and navigates to the dashboard.
   */
  const login = React.useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data)
    saveSession(response.accessToken, response.refreshToken, response.email)
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
   * Log the user out by clearing localStorage and redirecting to login.
   */
  const logout = React.useCallback(() => {
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
