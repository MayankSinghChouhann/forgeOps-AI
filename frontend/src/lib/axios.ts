import axios from 'axios'
import { clearAccessToken, getAccessToken } from '@/features/auth/tokenStore'

/**
 * Configured Axios instance for all ForgeOps API calls.
 *
 * Base URL points to the Spring Boot backend running locally on port 8080.
 * In production, this is replaced via the VITE_API_URL environment variable.
 *
 * Interceptors handle:
 * - Request: Attaches the in-memory JWT access token as a Bearer token
 *   on every outgoing request, so protected endpoints work automatically.
 * - Response: Catches 401 Unauthorized responses (e.g. expired token) and
 *   redirects the user to the login page, clearing stale credentials.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request Interceptor — attach the short-lived in-memory access token.
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor — handle 401 Unauthorized by clearing session and redirecting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/refresh']
      .some((path) => error.config?.url?.includes(path))
    if (error.response?.status === 401 && !isAuthEndpoint) {
      clearAccessToken()
      // Redirect to login page
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
