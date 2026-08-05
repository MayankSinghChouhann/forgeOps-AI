import apiClient from '@/lib/axios'
import type { LoginRequest, RegisterRequest, AuthResponse, TokenRefreshRequest } from '../types/auth.types'

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
   * Returns JWT access token, refresh token, and user email on success.
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data)
    return response.data
  },

  /**
   * Register a new user account.
   * Backend returns a plain success message string (not an AuthResponse),
   * so we login immediately after registration to get tokens.
   */
  register: async (data: RegisterRequest): Promise<void> => {
    await apiClient.post('/api/auth/register', data)
  },

  /**
   * Exchange a valid refresh token for a new access token.
   * Used to silently refresh sessions before the access token expires.
   */
  refreshToken: async (data: TokenRefreshRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/api/auth/refresh', data)
    return response.data
  },
}
