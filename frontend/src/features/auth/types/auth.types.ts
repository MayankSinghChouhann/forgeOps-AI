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
  role: UserRole
  permissions: Permission[]
}

export type UserRole = 'ADMIN' | 'OPERATOR' | 'APPROVER' | 'VIEWER'
export type Permission =
  | 'DASHBOARD_READ' | 'AI_USE' | 'ANALYSIS_RUN' | 'TEMPLATE_GENERATE'
  | 'COMMAND_RECOMMEND' | 'OPERATION_READ' | 'OPERATION_EXECUTE'
  | 'APPROVAL_DECIDE' | 'AUDIT_READ' | 'EVALUATION_READ' | 'USER_ADMIN'

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
  role: UserRole
  permissions: Permission[]
}
