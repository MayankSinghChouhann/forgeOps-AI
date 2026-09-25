/**
 * Auth types aligned with the actual Spring Boot backend DTOs.
 *
 * Backend AuthResponse record:
 *   String accessToken, String tokenType, String email
 *
 * Backend LoginRequest / RegisterRequest records accept:
 *   String email, String password  (plain text — bcrypt hashing is done server-side)
 */

export interface AuthResponse {
  accessToken: string
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

/**
 * Local representation of the logged-in user held in auth context.
 * Populated from the AuthResponse after a successful login or registration.
 */
export interface AuthUser {
  email: string
}
