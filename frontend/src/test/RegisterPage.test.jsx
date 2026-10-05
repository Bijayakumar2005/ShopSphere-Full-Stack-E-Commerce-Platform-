import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RegisterPage from '@/pages/public/RegisterPage'
import { authService } from '@/services/authService'

vi.mock('@/services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('RegisterPage QA Pass', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all 4 required form fields: Full name, Email address, Password, Confirm password', () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirm password/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Phone/i)).not.toBeInTheDocument()
  })

  it('validates required empty fields and prevents API request', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    const submitBtn = screen.getByRole('button', { name: /Create Account/i })
    await userEvent.click(submitBtn)

    expect(screen.getByText('Full name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('validates invalid email format without calling API', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByLabelText(/Full name/i), 'Alice Doe')
    await userEvent.type(screen.getByLabelText(/Email address/i), 'invalid-email-format')
    await userEvent.type(screen.getByLabelText(/^Password/i), 'Password123')
    await userEvent.type(screen.getByLabelText(/Confirm password/i), 'Password123')

    const submitBtn = screen.getByRole('button', { name: /Create Account/i })
    await userEvent.click(submitBtn)

    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('validates password minimum length (<6 chars) without calling API', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByLabelText(/Full name/i), 'Alice Doe')
    await userEvent.type(screen.getByLabelText(/Email address/i), 'alice@example.com')
    await userEvent.type(screen.getByLabelText(/^Password/i), '123')
    await userEvent.type(screen.getByLabelText(/Confirm password/i), '123')

    const submitBtn = screen.getByRole('button', { name: /Create Account/i })
    await userEvent.click(submitBtn)

    expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('validates password mismatch without calling API', async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByLabelText(/Full name/i), 'Alice Doe')
    await userEvent.type(screen.getByLabelText(/Email address/i), 'alice@example.com')
    await userEvent.type(screen.getByLabelText(/^Password/i), 'Password123')
    await userEvent.type(screen.getByLabelText(/Confirm password/i), 'Different123')

    const submitBtn = screen.getByRole('button', { name: /Create Account/i })
    await userEvent.click(submitBtn)

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(authService.register).not.toHaveBeenCalled()
  })

  it('submits valid form exactly once, prevents double clicking, and navigates to login', async () => {
    authService.register.mockResolvedValueOnce({
      token: 'jwt.token.mock',
      user: { id: 10, name: 'Alice Doe', email: 'alice@example.com', role: 'CUSTOMER' },
    })

    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<div>Login Page Mock</div>} />
        </Routes>
      </MemoryRouter>
    )

 await userEvent.type(screen.getByLabelText(/Full name/i), 'Alice Doe')
 await userEvent.type(screen.getByLabelText(/Email address/i), 'alice@example.com')
 await userEvent.type(screen.getByLabelText(/^Password/i), 'Password123')
 await userEvent.type(screen.getByLabelText(/Confirm password/i), 'Password123')

 const submitBtn = screen.getByRole('button', { name: /Create Account/i })
 
 // Simulate rapid double click
 await userEvent.click(submitBtn)
 await userEvent.click(submitBtn)

 // Verify exactly one registration API call
 expect(authService.register).toHaveBeenCalledTimes(1)
 expect(authService.register).toHaveBeenCalledWith({
 name: 'Alice Doe',
 email: 'alice@example.com',
 password: 'Password123',
 })

 await waitFor(() => {
 expect(screen.getByText('Login Page Mock')).toBeInTheDocument()
 })
 })

 it('retains non-password data (name, email) and clears password fields on registration failure', async () => {
 authService.register.mockRejectedValueOnce({
 response: {
 status: 400,
 data: {
 success: false,
 message: 'An account with email alice@example.com already exists',
 },
 },
 })

 render(
 <MemoryRouter>
 <RegisterPage />
 </MemoryRouter>
 )

 const nameInput = screen.getByLabelText(/Full name/i)
 const emailInput = screen.getByLabelText(/Email address/i)
 const passwordInput = screen.getByLabelText(/^Password/i)
 const confirmInput = screen.getByLabelText(/Confirm password/i)

 await userEvent.type(nameInput, 'Alice Doe')
 await userEvent.type(emailInput, 'alice@example.com')
 await userEvent.type(passwordInput, 'Password123')
 await userEvent.type(confirmInput, 'Password123')

 const submitBtn = screen.getByRole('button', { name: /Create Account/i })
 await userEvent.click(submitBtn)

 await waitFor(() => {
 expect(screen.getByText(/already exists/i)).toBeInTheDocument()
 })

 // Non-password fields kept
 expect(nameInput).toHaveValue('Alice Doe')
 expect(emailInput).toHaveValue('alice@example.com')
 // Password fields cleared
 expect(passwordInput).toHaveValue('')
 expect(confirmInput).toHaveValue('')
 })
})
