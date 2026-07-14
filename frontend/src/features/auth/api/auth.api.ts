import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth.types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const mockUser: User = {
  id: 1,
  email: 'dev@forgeops.ai',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    await delay(1000)
    if (data.email === 'error@forgeops.ai') {
      throw new Error('Invalid credentials')
    }
    return {
      user: { ...mockUser, email: data.email },
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token'
    }
  },
  
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    await delay(1000)
    if (data.email === 'error@forgeops.ai') {
      throw new Error('Email already registered')
    }
    return {
      user: { ...mockUser, email: data.email },
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token'
    }
  }
}
