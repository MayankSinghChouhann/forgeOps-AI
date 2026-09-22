import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthContext } from '@/features/auth/context/AuthContext'
import { LoginForm } from './LoginForm'

describe('LoginForm', () => {
  it('validates credentials and delegates a valid login', async () => {
    const user = userEvent.setup()
    const login = vi.fn().mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <AuthContext.Provider value={{
          user: null,
          isAuthenticated: false,
          isLoading: false,
          login,
          register: vi.fn(),
          logout: vi.fn(),
        }}>
          <LoginForm />
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText(/email/i), 'engineer@forgeops.ai')
    await user.type(screen.getByLabelText(/password/i), 'strong-password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(login).toHaveBeenCalledWith({
      email: 'engineer@forgeops.ai',
      password: 'strong-password',
    }))
  })
})
