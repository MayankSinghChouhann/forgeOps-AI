import apiClient from '@/lib/axios'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth.types'

let refreshInFlight: Promise<AuthResponse> | null = null

/**
 * Auth API module — all calls to the Spring Boot /api/auth/* endpoints.
 *
 * Uses the shared apiClient (src/lib/axios.ts) which handles:
 * - Base URL configuration
 * - JWT token attachment
 * - 401 response handling
 *
 * Endpoints map to AuthController.java:
 *   POST /api/auth/login    → authenticateUser()
 *   POST /api/auth/register → registerUser()
 *   POST /api/auth/refresh  → refreshToken()
 */
export const authApi = {
  /**
   * Authenticate a user with email and password.
   * Returns a short-lived JWT access token and user email on success.
   * The rotated refresh token is delivered only as an HttpOnly cookie.
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  /**
   * Register a new user account.
   * Backend returns a plain success message string (not an AuthResponse),
   * so we login immediately after registration to get tokens.
   */
  register: async (data: RegisterRequest): Promise<void> => {
    await apiClient.post('/auth/register', data)
  },

  /**
   * Exchange a valid refresh token for a new access token.
   * Used to silently refresh sessions before the access token expires.
   */
  refreshToken: async (): Promise<AuthResponse> => {
    if (!refreshInFlight) {
      refreshInFlight = apiClient.post<AuthResponse>('/auth/refresh')
        .then((response) => response.data)
        .finally(() => { refreshInFlight = null })
    }
    return refreshInFlight
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
}
