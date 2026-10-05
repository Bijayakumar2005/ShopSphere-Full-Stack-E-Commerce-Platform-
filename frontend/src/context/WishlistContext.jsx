import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { wishlistService, normalizeWishlist } from '@/services/wishlistService'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { toast } from 'react-hot-toast'

const WishlistContext = createContext(null)

const GUEST_WISHLIST_KEY = 'shopsphere_guest_wishlist'

function loadGuestWishlist() {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY)
    if (!raw) return normalizeWishlist(null)
    return normalizeWishlist(JSON.parse(raw))
  } catch {
    return normalizeWishlist(null)
  }
}

function saveGuestWishlist(wishlist) {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlist))
  } catch (e) {
    console.error('Failed to persist guest wishlist', e)
  }
}

export function WishlistProvider({ children }) {
  const { isAuthenticated, token } = useAuth()
  const { addToCart, refreshCart } = useCart()
  const [wishlist, setWishlist] = useState(() => normalizeWishlist(null))
  const [isLoading, setIsLoading] = useState(false)

  // Fetch or sync wishlist on auth change
  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist(loadGuestWishlist())
      return
    }

    setIsLoading(true)
    try {
      // Sync guest wishlist if any exists
      const guest = loadGuestWishlist()
      if (guest.items && guest.items.length > 0) {
        for (const item of guest.items) {
          try {
            await wishlistService.addToWishlist(item.productId)
          } catch {
            // Ignore individual failure
          }
        }
        localStorage.removeItem(GUEST_WISHLIST_KEY)
      }

      const serverWishlist = await wishlistService.getWishlist()
      setWishlist(serverWishlist)
    } catch (err) {
      console.error('Failed to fetch wishlist from server:', err)
      setWishlist(loadGuestWishlist())
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist, token])

  // Fast set lookup for wishlisted product IDs
  const wishlistedProductIds = useMemo(() => {
    const set = new Set()
    for (const item of wishlist.items || []) {
      set.add(item.productId)
    }
    return set
  }, [wishlist.items])

  const isWishlisted = useCallback(
    (productId) => {
      if (!productId) return false
      return wishlistedProductIds.has(Number(productId))
    },
    [wishlistedProductIds]
  )

  /**
   * Add a product to wishlist.
   */
  const addToWishlist = async (product) => {
    const productId = typeof product === 'object' ? product.id : Number(product)
    const productMeta = typeof product === 'object' ? product : null

    // Already wishlisted check
    if (isWishlisted(productId)) return

    // Optimistic UI update
    const previous = { ...wishlist }
    const newItem = {
      id: Date.now(),
      productId,
      name: productMeta?.name || 'Product',
      brand: productMeta?.brand || 'ShopSphere',
      category: productMeta?.category || 'General',
      price: productMeta ? productMeta.price : 0,
      originalPrice: productMeta?.originalPrice || null,
      discount: productMeta?.discount || 0,
      rating: productMeta?.rating || 0,
      image: productMeta?.imageUrl || productMeta?.image || '',
      emoji: productMeta?.emoji || '📦',
      accent: productMeta?.accent || '#6366f1',
      stockQuantity: productMeta?.stockQuantity != null ? productMeta.stockQuantity : 99,
    }

    const optimistic = {
      ...wishlist,
      items: [newItem, ...(wishlist.items || [])],
      totalItems: (wishlist.totalItems || 0) + 1,
    }
    setWishlist(optimistic)
    toast.success(`Added "${newItem.name.slice(0, 24)}…" to wishlist ❤️`, {
      icon: '❤️',
    })

    if (isAuthenticated) {
      try {
        const updated = await wishlistService.addToWishlist(productId)
        setWishlist(updated)
      } catch (err) {
        setWishlist(previous)
        toast.error('Failed to add to wishlist')
      }
    } else {
      saveGuestWishlist(optimistic)
    }
  }

  /**
   * Remove a product from wishlist.
   */
  const removeFromWishlist = async (productId, productName) => {
    const pId = Number(productId)
    const previous = { ...wishlist }

    const filtered = (wishlist.items || []).filter((i) => i.productId !== pId)
    const optimistic = {
      ...wishlist,
      items: filtered,
      totalItems: filtered.length,
    }

    setWishlist(optimistic)
    toast(productName ? `Removed "${productName.slice(0, 20)}…" from wishlist` : 'Removed from wishlist', {
      icon: '💔',
    })

    if (isAuthenticated) {
      try {
        const updated = await wishlistService.removeFromWishlist(pId)
        setWishlist(updated)
      } catch (err) {
        setWishlist(previous)
        toast.error('Failed to remove from wishlist')
      }
    } else {
      saveGuestWishlist(optimistic)
    }
  }

  /**
   * Toggle wishlist status for a product.
   */
  const toggleWishlist = async (product) => {
    const pId = typeof product === 'object' ? product.id : Number(product)
    if (isWishlisted(pId)) {
      await removeFromWishlist(pId, product?.name)
      return false
    } else {
      await addToWishlist(product)
      return true
    }
  }

  /**
   * Move a single product from wishlist to cart.
   */
  const moveToCart = async (product) => {
    const pId = typeof product === 'object' ? product.id : Number(product)
    const pName = typeof product === 'object' ? product.name : 'Product'

    try {
      if (isAuthenticated) {
        // Backend handles atomic cart addition + wishlist removal
        const updatedWishlist = await wishlistService.moveToCart(pId)
        setWishlist(updatedWishlist)
        if (refreshCart) {
          await refreshCart()
        }
      } else {
        // Guest mode
        await addToCart(product, 1, { openDrawer: false })
        await removeFromWishlist(pId, pName)
      }
      toast.success(`Moved "${pName.slice(0, 22)}…" to cart! 🛍️`)
    } catch (err) {
      toast.error('Failed to move item to cart')
    }
  }

  /**
   * Move all items from wishlist to cart.
   */
  const moveAllToCart = async () => {
    const allItems = [...(wishlist.items || [])]
    if (allItems.length === 0) return

    for (const item of allItems) {
      try {
        await addToCart(item, 1, { openDrawer: false })
        await removeFromWishlist(item.productId, item.name)
      } catch {
        // continue with other items
      }
    }
    toast.success(`Moved ${allItems.length} items to cart! 🛍️`)
  }

  const value = useMemo(
    () => ({
      wishlist,
      items: wishlist.items || [],
      totalItems: wishlist.totalItems || (wishlist.items ? wishlist.items.length : 0),
      isLoading,
      isWishlisted,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      moveToCart,
      moveAllToCart,
      refreshWishlist: fetchWishlist,
    }),
    [wishlist, isLoading, isWishlisted, fetchWishlist]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
