import apiClient from './apiClient'

/**
 * Normalizes wishlist response from backend.
 */
export function normalizeWishlist(raw) {
  if (!raw) {
    return {
      id: null,
      items: [],
      totalItems: 0,
    }
  }

  const items = (raw.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.productName || 'Product',
    brand: item.productBrand || 'ShopSphere',
    category: item.productCategory || 'General',
    price: typeof item.productPrice === 'number' ? item.productPrice : Number(item.productPrice || 0),
    originalPrice: item.productOriginalPrice != null ? Number(item.productOriginalPrice) : null,
    discount: item.productDiscount || 0,
    rating: typeof item.productRating === 'number' ? item.productRating : Number(item.productRating || 0),
    image: item.productImage || '',
    emoji: item.productEmoji || '📦',
    accent: item.productAccent || '#6366f1',
    stockQuantity: item.stockQuantity != null ? item.stockQuantity : 99,
  }))

  return {
    id: raw.id,
    userId: raw.userId,
    items,
    totalItems: raw.totalItems != null ? raw.totalItems : items.length,
  }
}

export const wishlistService = {
  /**
   * Fetch current user's wishlist.
   */
  async getWishlist() {
    const res = await apiClient.get('/wishlist')
    return normalizeWishlist(res.data?.data)
  },

  /**
   * Add a product to the wishlist (server prevents duplicates).
   */
  async addToWishlist(productId) {
    const res = await apiClient.post(`/wishlist/${productId}`)
    return normalizeWishlist(res.data?.data)
  },

  /**
   * Remove a product from the wishlist.
   */
  async removeFromWishlist(productId) {
    const res = await apiClient.delete(`/wishlist/${productId}`)
    return normalizeWishlist(res.data?.data)
  },

  /**
   * Move product from wishlist into cart.
   */
  async moveToCart(productId) {
    const res = await apiClient.post(`/wishlist/${productId}/move-to-cart`)
    return normalizeWishlist(res.data?.data)
  },
}
