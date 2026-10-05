import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ProductCard } from '@/components/product/ProductCard'

// Mock CartContext and WishlistContext
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
  }),
}))

vi.mock('@/context/WishlistContext', () => ({
  useWishlist: () => ({
    isWishlisted: () => false,
    toggleWishlist: vi.fn(),
  }),
}))

const mockProduct = {
  id: 101,
  name: 'Wireless Noise Cancelling Headphones',
  brand: 'AcousticPro',
  price: 4999,
  originalPrice: 7999,
  rating: 4.8,
  reviewCount: 142,
  stockQuantity: 12,
  emoji: '🎧',
  accent: '#6366f1',
}

describe('ProductCard Component', () => {
  it('renders product details correctly', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    )

    expect(screen.getByText('Wireless Noise Cancelling Headphones')).toBeInTheDocument()
    expect(screen.getByText('AcousticPro')).toBeInTheDocument()
    expect(screen.getByText('₹4,999')).toBeInTheDocument()
    expect(screen.getByText('₹7,999')).toBeInTheDocument()
    expect(screen.getAllByText('-38%').length).toBeGreaterThanOrEqual(1)
  })

  it('handles add to cart action', async () => {
    const handleAddToCart = vi.fn()
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} onAddToCart={handleAddToCart} />
      </MemoryRouter>
    )

    // Find the desktop or mobile Add to Cart button
    const buttons = screen.getAllByRole('button', { name: /add wireless noise cancelling headphones to cart/i })
    expect(buttons.length).toBeGreaterThan(0)
    await user.click(buttons[0])

    expect(handleAddToCart).toHaveBeenCalledTimes(1)
    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct)
  })

  it('renders out of stock state when stock is 0', () => {
    const outOfStockProduct = { ...mockProduct, stockQuantity: 0 }
    render(
      <MemoryRouter>
        <ProductCard product={outOfStockProduct} />
      </MemoryRouter>
    )

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
  })
})
