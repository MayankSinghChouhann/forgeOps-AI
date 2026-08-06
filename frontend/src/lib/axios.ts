import axios from 'axios'

/**
 * Configured Axios instance for all ForgeOps API calls.
 *
 * Base URL points to the Spring Boot backend running locally on port 8080.
 * In production, this is replaced via the VITE_API_URL environment variable.
 *
 * Interceptors handle:
 * - Request: Attaches the JWT access token from localStorage as a Bearer token
 *   on every outgoing request, so protected endpoints work automatically.
 * - Response: Catches 401 Unauthorized responses (e.g. expired token) and
 *   redirects the user to the login page, clearing stale credentials.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor — attach JWT Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
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
    const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') || error.config?.url?.includes('/api/auth/register')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Clear all stored auth data on token expiry or invalid token
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userEmail')
      // Redirect to login page
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
