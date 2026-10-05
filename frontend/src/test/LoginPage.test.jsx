import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from '@/pages/public/LoginPage'
import { AuthProvider } from '@/context/AuthContext'
import { authService } from '@/services/authService'
import { toast } from 'react-hot-toast'

vi.mock('@/services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function renderLoginPage({ initialEntries = ['/login'], authState = null } = {}) {
  if (authState) {
    localStorage.setItem('shopsphere_token', authState.token)
    localStorage.setItem('shopsphere_user', JSON.stringify(authState.user))
  } else {
    localStorage.removeItem('shopsphere_token')
    localStorage.removeItem('shopsphere_user')
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
          <Route path="/register" element={<div data-testid="register-page">Register Page</div>} />
          <Route path="/admin" element={<div data-testid="admin-dashboard">Admin Dashboard</div>} />
          <Route path="/checkout" element={<div data-testid="checkout-page">Checkout Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('LoginPage QA & Polish Pass', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders required UI elements: Email, Password, Show/Hide, Login button, Create Account link without demo credentials', () => {
    renderLoginPage()

    const emailInput = screen.getByLabelText(/Email address/i)
    const passwordInput = screen.getByLabelText(/^Password/i)
    const submitBtn = screen.getByRole('button', { name: /Sign in/i })
    const showHideBtn = screen.getByLabelText(/Show password/i)
    const registerLink = screen.getByRole('link', { name: /Create Account/i })

    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(submitBtn).toBeInTheDocument()
    expect(showHideBtn).toBeInTheDocument()
    expect(registerLink).toBeInTheDocument()

    expect(emailInput.value).toBe('')
    expect(passwordInput.value).toBe('')

    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sample/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/recommended/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/JWT Token Session/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/forgot password/i)).not.toBeInTheDocument()
  })

  it('toggles password visibility with show/hide password control', async () => {
    renderLoginPage()

    const passwordInput = screen.getByLabelText(/^Password/i)
    const toggleBtn = screen.getByLabelText(/Show password/i)

    expect(passwordInput).toHaveAttribute('type', 'password')

    await userEvent.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText(/Hide password/i)).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText(/Hide password/i))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('validates empty form and stops submission', async () => {
    renderLoginPage()

    const submitBtn = screen.getByRole('button', { name: /Sign in/i })
    await userEvent.click(submitBtn)

    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('validates invalid email format and minimum password length', async () => {
    renderLoginPage()

    const emailInput = screen.getByLabelText(/Email address/i)
    const passwordInput = screen.getByLabelText(/^Password/i)
    const submitBtn = screen.getByRole('button', { name: /Sign in/i })

    await userEvent.type(emailInput, 'notanemail')
    await userEvent.type(passwordInput, '123')
    await userEvent.click(submitBtn)

    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument()
    expect(authService.login).not.toHaveBeenCalled()
  })

  it('handles invalid authentication gracefully, displays error, and preserves entered email', async () => {
    authService.login.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Invalid email or password. Please try again.' },
      },
    })

    renderLoginPage()

    const emailInput = screen.getByLabelText(/Email address/i)
    const passwordInput = screen.getByLabelText(/^Password/i)
    const submitBtn = screen.getByRole('button', { name: /Sign in/i })

    await userEvent.type(emailInput, 'wrong@example.com')
    await userEvent.type(passwordInput, 'wrongpass123')
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password. Please try again.')
    })
    expect(toast.error).toHaveBeenCalledWith('Invalid email or password. Please try again.')
    expect(emailInput.value).toBe('wrong@example.com')
  })

  it('prevents duplicate requests on double-click submission', async () => {
    let resolveLogin
    authService.login.mockReturnValue(
      new Promise((res) => {
        resolveLogin = res
      })
    )

    renderLoginPage()

    const emailInput = screen.getByLabelText(/Email address/i)
    const passwordInput = screen.getByLabelText(/^Password/i)
    const submitBtn = screen.getByRole('button', { name: /Sign in/i })

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'password123')

    await userEvent.click(submitBtn)
    await userEvent.click(submitBtn)

    expect(authService.login).toHaveBeenCalledTimes(1)

    await waitFor(async () => {
      resolveLogin({
        token: 'jwt-test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'CUSTOMER' },
      })
    })
  })

  it('successfully logs in a customer and redirects to target route', async () => {
    authService.login.mockResolvedValueOnce({
      token: 'jwt-customer-token',
      user: { id: 10, name: 'Jane Doe', email: 'jane@example.com', role: 'CUSTOMER' },
    })

    renderLoginPage({
      initialEntries: [{ pathname: '/login', state: { from: { pathname: '/checkout' } } }],
    })

    const emailInput = screen.getByLabelText(/Email address/i)
    const passwordInput = screen.getByLabelText(/^Password/i)
    const submitBtn = screen.getByRole('button', { name: /Sign in/i })

    await userEvent.type(emailInput, 'jane@example.com')
    await userEvent.type(passwordInput, 'SecurePass123')
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByTestId('checkout-page')).toBeInTheDocument()
    })

    expect(toast.success).toHaveBeenCalledWith('Welcome back, Jane Doe!')
    expect(localStorage.getItem('shopsphere_token')).toBe('jwt-customer-token')
  })

  it('safely redirects customers attempting admin route to home page rather than admin dashboard', async () => {
    authService.login.mockResolvedValueOnce({
      token: 'jwt-customer-token',
      user: { id: 10, name: 'Regular Customer', email: 'cust@example.com', role: 'CUSTOMER' },
    })

    renderLoginPage({
      initialEntries: [{ pathname: '/login', state: { from: { pathname: '/admin' } } }],
    })

    const emailInput = screen.getByLabelText(/Email address/i)
    const passwordInput = screen.getByLabelText(/^Password/i)
    const submitBtn = screen.getByRole('button', { name: /Sign in/i })

    await userEvent.type(emailInput, 'cust@example.com')
    await userEvent.type(passwordInput, 'Customer123!')
    await userEvent.click(submitBtn)

    // Should redirect to home page, NOT admin
    await waitFor(() => {
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument()
  })

  it('successfully logs in an admin and redirects to /admin', async () => {
    authService.login.mockResolvedValueOnce({
      token: 'jwt-admin-token',
      user: { id: 1, name: 'Admin Boss', email: 'admin@shopsphere.com', role: 'ADMIN' },
    })

    renderLoginPage()

    const emailInput = screen.getByLabelText(/Email address/i)
    const passwordInput = screen.getByLabelText(/^Password/i)
    const submitBtn = screen.getByRole('button', { name: /Sign in/i })

    await userEvent.type(emailInput, 'admin@shopsphere.com')
    await userEvent.type(passwordInput, 'Admin1234!')
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument()
    })
  })
})
