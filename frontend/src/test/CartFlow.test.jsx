import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CartProvider, useCart } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { cartService } from '@/services/cartService'
import { authService } from '@/services/authService'
import { toast } from 'react-hot-toast'

vi.mock('@/services/authService', () => ({
  authService: {
    getProfile: vi.fn().mockResolvedValue({ id: 1, name: 'Test Customer', email: 'cust@test.com', role: 'CUSTOMER' }),
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('@/services/cartService', () => ({
  normalizeCart: vi.fn((raw) => ({
    id: raw?.id || 1,
    items: raw?.items || [],
    totalItems: raw?.totalItems || (raw?.items || []).reduce((s, i) => s + i.quantity, 0),
    subtotal: raw?.subtotal || 0,
    discount: 0,
    shipping: 0,
    totalAmount: raw?.totalAmount || 0,
  })),
  cartService: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateItemQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  },
}))

vi.mock('react-hot-toast', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

function TestCartConsumer() {
  const { cart, items, totalItems, addToCart, updateQuantity, removeFromCart, isLoading } = useCart()

  return (
    <div>
      <div data-testid="total-items">{totalItems}</div>
      <div data-testid="cart-loading">{isLoading ? 'loading' : 'idle'}</div>
      <button
        onClick={() => addToCart({ id: 1, name: 'Headphones', price: 299.99 }, 1)}
      >
        Add Product 1
      </button>
      <button
        onClick={() => addToCart({ id: 2, name: 'Watch', price: 199.99 }, 2)}
      >
        Add Product 2
      </button>
      <div data-testid="items-list">
        {items.map((i) => (
          <div key={i.id} data-testid={`item-${i.id}`}>
            <span>{i.name}</span> - <span>{i.quantity}</span>
            <button onClick={() => updateQuantity(i.id, i.quantity + 1)}>Plus</button>
            <button onClick={() => removeFromCart(i.id, i.name)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function renderWithProviders({ authenticated = false } = {}) {
  if (authenticated) {
    localStorage.setItem('shopsphere_token', 'test-token-123')
    localStorage.setItem('shopsphere_user', JSON.stringify({ id: 1, name: 'Test Customer', email: 'cust@test.com', role: 'CUSTOMER' }))
  } else {
    localStorage.removeItem('shopsphere_token')
    localStorage.removeItem('shopsphere_user')
  }

  return render(
    <MemoryRouter initialEntries={['/products']}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/products" element={<TestCartConsumer />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Cart Flow & Context Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authService.getProfile.mockResolvedValue({ id: 1, name: 'Test Customer', email: 'cust@test.com', role: 'CUSTOMER' })
  })

  it('redirects logged-out user to login when attempting to add to cart', async () => {
    renderWithProviders({ authenticated: false })

    const addBtn = screen.getByText('Add Product 1')
    await userEvent.click(addBtn)

    expect(toast.error).toHaveBeenCalledWith('Please log in to add items to your cart')
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(cartService.addItem).not.toHaveBeenCalled()
  })

  it('allows authenticated customer to add product and updates cart count', async () => {
    cartService.getCart.mockResolvedValueOnce({
      id: 1,
      items: [],
      totalItems: 0,
      subtotal: 0,
      totalAmount: 0,
    })

    cartService.addItem.mockResolvedValueOnce({
      id: 1,
      items: [{ id: 101, productId: 1, name: 'Headphones', price: 299.99, quantity: 1, subtotal: 299.99, stockQuantity: 10 }],
      totalItems: 1,
      subtotal: 299.99,
      totalAmount: 299.99,
    })

    renderWithProviders({ authenticated: true })

    const addBtn = screen.getByText('Add Product 1')
    await userEvent.click(addBtn)

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1')
    })
    expect(cartService.addItem).toHaveBeenCalledWith(1, 1)
    expect(toast.success).toHaveBeenCalledWith('Added to cart!')
  })

  it('updates quantity of existing cart item correctly', async () => {
    cartService.getCart.mockResolvedValueOnce({
      id: 1,
      items: [{ id: 101, productId: 1, name: 'Headphones', price: 299.99, quantity: 1, subtotal: 299.99, stockQuantity: 10 }],
      totalItems: 1,
      subtotal: 299.99,
      totalAmount: 299.99,
    })

    cartService.updateItemQuantity.mockResolvedValueOnce({
      id: 1,
      items: [{ id: 101, productId: 1, name: 'Headphones', price: 299.99, quantity: 2, subtotal: 599.98, stockQuantity: 10 }],
      totalItems: 2,
      subtotal: 599.98,
      totalAmount: 599.98,
    })

    renderWithProviders({ authenticated: true })

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1')
    })

    const plusBtn = screen.getByText('Plus')
    await userEvent.click(plusBtn)

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('2')
    })
    expect(cartService.updateItemQuantity).toHaveBeenCalledWith(101, 2)
  })

  it('rolls back optimistic state if updateItemQuantity API fails', async () => {
    cartService.getCart.mockResolvedValueOnce({
      id: 1,
      items: [{ id: 101, productId: 1, name: 'Headphones', price: 299.99, quantity: 1, subtotal: 299.99, stockQuantity: 10 }],
      totalItems: 1,
      subtotal: 299.99,
      totalAmount: 299.99,
    })

    cartService.updateItemQuantity.mockRejectedValueOnce({
      response: { data: { message: 'Stock limit reached' } },
    })

    renderWithProviders({ authenticated: true })

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1')
    })

    const plusBtn = screen.getByText('Plus')
    await userEvent.click(plusBtn)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Stock limit reached')
      expect(screen.getByTestId('total-items')).toHaveTextContent('1')
    })
  })

  it('removes item from cart when remove button is clicked', async () => {
    cartService.getCart.mockResolvedValueOnce({
      id: 1,
      items: [{ id: 101, productId: 1, name: 'Headphones', price: 299.99, quantity: 1, subtotal: 299.99, stockQuantity: 10 }],
      totalItems: 1,
      subtotal: 299.99,
      totalAmount: 299.99,
    })

    cartService.removeItem.mockResolvedValueOnce({
      id: 1,
      items: [],
      totalItems: 0,
      subtotal: 0,
      totalAmount: 0,
    })

    renderWithProviders({ authenticated: true })

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('1')
    })

    const removeBtn = screen.getByText('Remove')
    await userEvent.click(removeBtn)

    await waitFor(() => {
      expect(screen.getByTestId('total-items')).toHaveTextContent('0')
    })
    expect(cartService.removeItem).toHaveBeenCalledWith(101)
  })
})
