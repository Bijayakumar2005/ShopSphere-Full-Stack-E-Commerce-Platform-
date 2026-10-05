import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cartService, normalizeCart } from '@/services/cartService'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cart, setCart] = useState(() => normalizeCart(null))
  const [isLoading, setIsLoading] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const openCartDrawer = useCallback(() => setIsDrawerOpen(true), [])
  const closeCartDrawer = useCallback(() => setIsDrawerOpen(false), [])

  // Sync cart with backend whenever authentication changes or token updates
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(normalizeCart(null))
      return
    }

    setIsLoading(true)
    try {
      const serverCart = await cartService.getCart()
      setCart(serverCart)
    } catch (err) {
      console.error('Failed to fetch cart from server:', err)
      setCart(normalizeCart(null))
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchCart()
  }, [fetchCart, token])

  /**
   * Add a product to the cart.
   * Accepts either (productId, quantity) or (productObject, quantity)
   */
  const addToCart = async (productOrId, quantity = 1, options = { openDrawer: true }) => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart')
      navigate('/login', { state: { from: location } })
      return null
    }

    const productId = typeof productOrId === 'object'
      ? Number(productOrId.productId || productOrId.id)
      : Number(productOrId)

    if (!productId || isNaN(productId)) {
      toast.error('Invalid product')
      return null
    }

    setIsLoading(true)
    try {
      const updated = await cartService.addItem(productId, quantity)
      setCart(updated)
      toast.success('Added to cart!')
      if (options.openDrawer) {
        setIsDrawerOpen(true)
      }
      return updated
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to add item to cart'
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update quantity of an item in the cart.
   */
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return
    if (!isAuthenticated) {
      toast.error('Please log in to update your cart')
      navigate('/login', { state: { from: location } })
      return
    }

    const previousCart = { ...cart }

    // Optimistic UI update
    const optimisticItems = cart.items.map((i) => {
      if (i.id === itemId) {
        if (newQuantity > i.stockQuantity) {
          toast.error(`Only ${i.stockQuantity} items in stock`)
          return i
        }
        return {
          ...i,
          quantity: newQuantity,
          subtotal: i.price * newQuantity,
        }
      }
      return i
    })

    const optSubtotal = optimisticItems.reduce((s, i) => s + i.subtotal, 0)
    setCart((prev) => ({
      ...prev,
      items: optimisticItems,
      totalItems: optimisticItems.reduce((s, i) => s + i.quantity, 0),
      subtotal: optSubtotal,
      shipping: optSubtotal >= 999 ? 0 : 99,
      totalAmount: optSubtotal + (optSubtotal >= 999 ? 0 : 99) - prev.discount,
    }))

    try {
      const updated = await cartService.updateItemQuantity(itemId, newQuantity)
      setCart(updated)
    } catch (err) {
      // Rollback on error
      setCart(previousCart)
      const msg = err.response?.data?.message || err.message || 'Failed to update quantity'
      toast.error(msg)
    }
  }

  /**
   * Remove a single item from the cart.
   */
  const removeFromCart = async (itemId, itemName) => {
    if (!isAuthenticated) return
    const previousCart = { ...cart }

    // Optimistic remove
    const filteredItems = cart.items.filter((i) => i.id !== itemId)
    const newSubtotal = filteredItems.reduce((s, i) => s + i.subtotal, 0)
    setCart((prev) => ({
      ...prev,
      items: filteredItems,
      totalItems: filteredItems.reduce((s, i) => s + i.quantity, 0),
      subtotal: newSubtotal,
      shipping: newSubtotal >= 999 || filteredItems.length === 0 ? 0 : 99,
      totalAmount: filteredItems.length === 0 ? 0 : newSubtotal + (newSubtotal >= 999 ? 0 : 99),
    }))

    toast(itemName ? `Removed "${itemName.slice(0, 20)}…" from cart` : 'Item removed from cart', {
      icon: '🗑️',
    })

    try {
      const updated = await cartService.removeItem(itemId)
      setCart(updated)
    } catch (err) {
      setCart(previousCart)
      toast.error('Failed to remove item')
    }
  }

  /**
   * Clear all items in the cart.
   */
  const clearCart = async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const updated = await cartService.clearCart()
      setCart(updated)
      toast.success('Cart cleared')
    } catch (err) {
      toast.error('Failed to clear cart')
    } finally {
      setIsLoading(false)
    }
  }

  const value = useMemo(
    () => ({
      cart,
      items: cart.items || [],
      totalItems: cart.totalItems || 0,
      subtotal: cart.subtotal || 0,
      discount: cart.discount || 0,
      shipping: cart.shipping || 0,
      totalAmount: cart.totalAmount || 0,
      isLoading,
      isCartDrawerOpen: isDrawerOpen,
      openCartDrawer,
      closeCartDrawer,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart: fetchCart,
    }),
    [cart, isLoading, isDrawerOpen, fetchCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
