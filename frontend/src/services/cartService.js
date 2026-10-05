import apiClient from './apiClient'

/**
 * Normalizes cart response from backend to ensure consistent state.
 */
export function normalizeCart(raw) {
  if (!raw) {
    return {
      id: null,
      items: [],
      totalItems: 0,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      totalAmount: 0,
    }
  }

  const items = (raw.items || []).map((item) => {
    const name = item.productName || item.name || 'Product'
    const brand = item.productBrand || item.brand || 'ShopSphere'
    const price = typeof item.productPrice === 'number'
      ? item.productPrice
      : typeof item.price === 'number'
      ? item.price
      : Number(item.productPrice || item.price || 0)
    const originalPrice = item.productOriginalPrice != null
      ? Number(item.productOriginalPrice)
      : (item.originalPrice != null ? Number(item.originalPrice) : null)
    const discount = item.productDiscount != null
      ? item.productDiscount
      : (item.discount || 0)
    const image = item.productImage || item.imageUrl || item.image || ''
    const emoji = item.productEmoji || item.emoji || '📦'
    const accent = item.productAccent || item.accent || '#6366f1'
    const quantity = item.quantity || 1
    const stockQuantity = item.stockQuantity != null ? item.stockQuantity : 99
    const subtotal = typeof item.subtotal === 'number'
      ? item.subtotal
      : Number(item.subtotal || (price * quantity))
    const discountAmount = typeof item.discountAmount === 'number'
      ? item.discountAmount
      : Number(item.discountAmount || (originalPrice && originalPrice > price ? (originalPrice - price) * quantity : 0))

    return {
      id: item.id,
      productId: item.productId,
      name,
      brand,
      price,
      originalPrice,
      discount,
      image,
      emoji,
      accent,
      quantity,
      stockQuantity,
      subtotal,
      discountAmount,
    }
  })

  const subtotal = typeof raw.subtotal === 'number' ? raw.subtotal : items.reduce((s, i) => s + i.subtotal, 0)
  const discount = typeof raw.discount === 'number' ? raw.discount : items.reduce((s, i) => s + (i.discountAmount || 0), 0)
  const shipping = typeof raw.shipping === 'number' ? raw.shipping : (subtotal >= 999 || items.length === 0 ? 0 : 99)
  const totalAmount = typeof raw.totalAmount === 'number'
    ? raw.totalAmount
    : (items.length === 0 ? 0 : Math.max(0, subtotal + shipping - discount))

  return {
    id: raw.id,
    userId: raw.userId,
    items,
    totalItems: raw.totalItems != null ? raw.totalItems : items.reduce((acc, i) => acc + i.quantity, 0),
    subtotal,
    discount,
    shipping,
    totalAmount,
  }
}

export const cartService = {
  /**
   * Fetch current user's shopping cart.
   */
  async getCart() {
    const res = await apiClient.get('/cart')
    return normalizeCart(res.data?.data)
  },

  /**
   * Add a product to the cart with quantity.
   */
  async addItem(productId, quantity = 1) {
    const res = await apiClient.post('/cart/items', { productId, quantity })
    return normalizeCart(res.data?.data)
  },

  /**
   * Update item quantity in the cart.
   */
  async updateItemQuantity(itemId, quantity) {
    const res = await apiClient.put(`/cart/items/${itemId}`, { quantity })
    return normalizeCart(res.data?.data)
  },

  /**
   * Remove a single item from the cart.
   */
  async removeItem(itemId) {
    const res = await apiClient.delete(`/cart/items/${itemId}`)
    return normalizeCart(res.data?.data)
  },

  /**
   * Clear all items in the cart.
   */
  async clearCart() {
    const res = await apiClient.delete('/cart')
    return normalizeCart(res.data?.data)
  },
}
