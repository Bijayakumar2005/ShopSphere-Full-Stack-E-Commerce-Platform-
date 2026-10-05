import apiClient from './apiClient'
import { PRODUCTS } from '@/data/mockData'

/**
 * Normalizes raw product from API (or mock data) to guarantee all expected UI fields exist.
 */
export function normalizeProduct(p) {
  if (!p) return null

  const categoryName =
    typeof p.category === 'object' && p.category?.name
      ? p.category.name
      : (p.categoryName || (typeof p.category === 'string' ? p.category : 'General'))

  const categorySlug =
    typeof p.category === 'object' && p.category?.slug
      ? p.category.slug
      : categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const numPrice = typeof p.price === 'number' ? p.price : Number(p.price || 0)
  const numOrigPrice = p.originalPrice != null
    ? (typeof p.originalPrice === 'number' ? p.originalPrice : Number(p.originalPrice))
    : null

  const stock = p.stockQuantity ?? p.stock ?? 0

  return {
    id: p.id,
    name: p.name || 'Untitled Product',
    brand: p.brand || 'ShopSphere',
    description: p.description || '',
    price: numPrice,
    originalPrice: numOrigPrice,
    discount: p.discount ?? (numOrigPrice && numOrigPrice > numPrice
      ? Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100)
      : 0),
    stockQuantity: stock,
    stock: stock,
    rating: Number(p.rating ?? 4.5),
    reviewCount: Number(p.reviewCount ?? 12),
    imageUrl: p.imageUrl || p.image || '',
    image: p.imageUrl || p.image || '',
    emoji: p.emoji || '📦',
    accent: p.accent || '#6366f1',
    active: p.active !== false,
    category: categoryName,
    categoryId: p.categoryId || (typeof p.category === 'object' ? p.category?.id : null),
    categoryName,
    categorySlug,
    features: p.features || [
      'High-grade premium build quality',
      'Engineered for maximum reliability and daily use',
      'Designed with energy-efficient sustainable materials',
      'Certified authentic and manufacturer warranted',
    ],
    tags: p.tags || [categoryName.toLowerCase(), (p.brand || '').toLowerCase()].filter(Boolean),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

/**
 * Product Service — communicates with Spring Boot REST API (/api/products).
 */
export const productService = {
  /**
   * Fetch paginated and filtered products from Spring Boot REST API.
   *
   * @param {object} params
   * @param {string} [params.search]
   * @param {string} [params.category]
   * @param {string[]} [params.brands]
   * @param {number} [params.minPrice]
   * @param {number} [params.maxPrice]
   * @param {number} [params.rating]
   * @param {boolean} [params.inStockOnly]
   * @param {'featured'|'newest'|'price-asc'|'price-desc'|'rating'} [params.sort='featured']
   * @param {number} [params.page=1]
   * @param {number} [params.limit=8]
   * @returns {Promise<{ products: Array, total: number, page: number, totalPages: number, limit: number }>}
   */
  async getProducts({
    search = '',
    category = '',
    brands = [],
    minPrice = 0,
    maxPrice = Infinity,
    rating = 0,
    inStockOnly = false,
    sort = 'featured',
    page = 1,
    limit = 8,
  } = {}) {
    const apiParams = {
      page: Math.max(0, page - 1), // Spring Boot is 0-indexed
      size: limit,
      sort,
    }

    if (search && search.trim()) {
      apiParams.keyword = search.trim()
    }

    if (category && category.trim()) {
      apiParams.category = category.trim()
    }

    if (brands && brands.length > 0) {
      apiParams.brand = brands.join(',')
    }

    if (minPrice > 0) {
      apiParams.minPrice = minPrice
    }

    if (maxPrice < Infinity && maxPrice > 0) {
      apiParams.maxPrice = maxPrice
    }

    if (rating > 0) {
      apiParams.rating = rating
    }

    try {
      const response = await apiClient.get('/products', { params: apiParams })
      const data = response.data?.data

      if (!data || !Array.isArray(data.content)) {
        throw new Error('Invalid product data received from server.')
      }

      let items = data.content.map(normalizeProduct)

      // Handle in-stock filter client-side if selected
      if (inStockOnly) {
        items = items.filter((p) => (p.stockQuantity || 0) > 0)
      }

      const total = data.totalElements ?? items.length
      const totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit))
      const currentPage = (data.pageNumber ?? 0) + 1

      return {
        products: items,
        total,
        page: currentPage,
        totalPages,
        limit,
      }
    } catch (err) {
      console.warn('API getProducts error, checking mock fallback if applicable:', err.message)
      
      // If server is completely offline in local preview mode, fallback to mock data
      if (!err.response && PRODUCTS && PRODUCTS.length > 0) {
        let fallback = [...PRODUCTS].map(normalizeProduct)
        if (search && search.trim()) {
          const q = search.toLowerCase().trim()
          fallback = fallback.filter((p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
          )
        }
        if (category) {
          fallback = fallback.filter((p) =>
            p.category.toLowerCase() === category.toLowerCase()
          )
        }
        if (brands && brands.length > 0) {
          fallback = fallback.filter((p) => brands.includes(p.brand))
        }
        if (minPrice > 0 || maxPrice < Infinity) {
          fallback = fallback.filter((p) => p.price >= minPrice && p.price <= maxPrice)
        }
        if (rating > 0) {
          fallback = fallback.filter((p) => (p.rating || 0) >= rating)
        }
        if (inStockOnly) {
          fallback = fallback.filter((p) => p.stockQuantity > 0)
        }
        const total = fallback.length
        const totalPages = Math.max(1, Math.ceil(total / limit))
        const validPage = Math.min(Math.max(1, page), totalPages)
        const startIndex = (validPage - 1) * limit
        return {
          products: fallback.slice(startIndex, startIndex + limit),
          total,
          page: validPage,
          totalPages,
          limit,
        }
      }

      throw new Error(
        err.response?.data?.message || err.message || 'Failed to fetch products from server.'
      )
    }
  },

  /**
   * Get single product by ID from REST API.
   *
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  async getProductById(id) {
    try {
      const response = await apiClient.get(`/products/${id}`)
      const raw = response.data?.data
      if (!raw) {
        throw new Error('Product not found')
      }
      return normalizeProduct(raw)
    } catch (err) {
      // If 404 or backend unavailable, check mock data fallback
      const foundMock = PRODUCTS?.find((p) => p.id === Number(id))
      if (foundMock) {
        return normalizeProduct(foundMock)
      }
      throw new Error(
        err.response?.data?.message || err.message || 'Product could not be retrieved.'
      )
    }
  },

  /**
   * Fetch featured / trending products.
   *
   * @param {number} [limit=8]
   * @returns {Promise<Array>}
   */
  async getFeaturedProducts(limit = 8) {
    const res = await this.getProducts({ limit, sort: 'featured' })
    return res.products
  },

  /**
   * Fetch related products based on category or brand.
   */
  async getRelatedProducts(productId, category = '', limit = 4) {
    try {
      const res = await this.getProducts({ category, limit: limit + 2 })
      return res.products.filter((p) => p.id !== Number(productId)).slice(0, limit)
    } catch {
      return []
    }
  },

  /**
   * Fetch all categories from backend API.
   */
  async getCategories() {
    try {
      const response = await apiClient.get('/categories')
      return response.data?.data || []
    } catch (err) {
      console.warn('Failed to fetch categories from API, using fallback:', err)
      return [
        { id: 1, name: 'Electronics', slug: 'electronics', icon: '⚡' },
        { id: 2, name: 'Clothing', slug: 'clothing', icon: '👕' },
        { id: 3, name: 'Books', slug: 'books', icon: '📚' },
        { id: 4, name: 'Home & Garden', slug: 'home', icon: '🏠' },
        { id: 5, name: 'Sports', slug: 'sports', icon: '⚽' },
        { id: 6, name: 'Beauty', slug: 'beauty', icon: '💄' },
      ]
    }
  },

  /**
   * Admin: Create a new product.
   */
  async createProduct(productData) {
    const payload = {
      name: productData.name,
      brand: productData.brand,
      description: productData.description,
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      discount: productData.discount ? Number(productData.discount) : undefined,
      stockQuantity: Number(productData.stockQuantity ?? productData.stock ?? 0),
      categoryId: Number(productData.categoryId),
      imageUrl: productData.imageUrl || productData.image || '',
      emoji: productData.emoji || '📦',
      accent: productData.accent || '#6366f1',
    }
    const response = await apiClient.post('/products', payload)
    return normalizeProduct(response.data?.data)
  },

  /**
   * Admin: Update an existing product.
   */
  async updateProduct(id, productData) {
    const payload = {
      name: productData.name,
      brand: productData.brand,
      description: productData.description,
      price: Number(productData.price),
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
      discount: productData.discount ? Number(productData.discount) : undefined,
      stockQuantity: Number(productData.stockQuantity ?? productData.stock ?? 0),
      categoryId: productData.categoryId ? Number(productData.categoryId) : undefined,
      imageUrl: productData.imageUrl || productData.image || '',
      emoji: productData.emoji,
      accent: productData.accent,
      active: productData.active,
    }
    const response = await apiClient.put(`/products/${id}`, payload)
    return normalizeProduct(response.data?.data)
  },

  /**
   * Admin: Quick stock update.
   */
  async updateProductStock(id, stockQuantity) {
    const response = await apiClient.patch(`/products/${id}/stock`, {
      stockQuantity: Number(stockQuantity),
    })
    return normalizeProduct(response.data?.data)
  },

  /**
   * Admin: Quick price update.
   */
  async updateProductPrice(id, { price, originalPrice, discount }) {
    const payload = {
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discount: discount ? Number(discount) : undefined,
    }
    const response = await apiClient.patch(`/products/${id}/price`, payload)
    return normalizeProduct(response.data?.data)
  },

  /**
   * Admin: Delete product (soft delete).
   */
  async deleteProduct(id) {
    const response = await apiClient.delete(`/products/${id}`)
    return response.data
  },
}
