import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/Input'

describe('Input Component', () => {
  it('renders input with label and placeholder', () => {
    render(<Input label="Full Name" placeholder="John Doe" />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument()
  })

  it('handles text typing correctly', async () => {
    const user = userEvent.setup()
    render(<Input label="Email" />)
    const input = screen.getByLabelText(/email/i)

    await user.type(input, 'test@example.com')
    expect(input).toHaveValue('test@example.com')
  })

  it('displays error message with role alert and sets aria-invalid', () => {
    render(<Input label="Password" error="Password is required" />)
    const input = screen.getByLabelText(/password/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Password is required')
  })

  it('displays helper text when no error is present', () => {
    render(<Input label="Username" helper="Must be at least 3 characters" />)
    expect(screen.getByText(/must be at least 3 characters/i)).toBeInTheDocument()
  })
})
