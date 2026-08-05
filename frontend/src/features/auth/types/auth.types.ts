/**
 * Auth types aligned with the actual Spring Boot backend DTOs.
 *
 * Backend AuthResponse record:
 *   String accessToken, String refreshToken, String tokenType, String email
 *
 * Backend LoginRequest / RegisterRequest records accept:
 *   String email, String password  (plain text — bcrypt hashing is done server-side)
 */

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface TokenRefreshRequest {
  refreshToken: string
}

/**
 * Local representation of the logged-in user stored in auth context.
 * Populated from the AuthResponse after a successful login or registration.
 */
export interface AuthUser {
  email: string
}
