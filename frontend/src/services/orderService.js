import apiClient from './apiClient'

/**
 * Normalizes an order response to guarantee uniform UI fields.
 */
export function normalizeOrder(raw) {
  if (!raw) return null

  const items = (raw.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.productName || 'Product',
    brand: item.productBrand || 'ShopSphere',
    image: item.productImage || '',
    emoji: item.productEmoji || '📦',
    accent: item.productAccent || '#6366f1',
    price: typeof item.price === 'number' ? item.price : Number(item.price || 0),
    quantity: item.quantity || 1,
    subtotal: typeof item.subtotal === 'number' ? item.subtotal : Number(item.subtotal || 0),
  }))

  const subtotal = typeof raw.subtotal === 'number' ? raw.subtotal : Number(raw.subtotal || 0)
  const discountAmount = typeof raw.discountAmount === 'number' ? raw.discountAmount : Number(raw.discountAmount || 0)
  const shippingFee = typeof raw.shippingFee === 'number' ? raw.shippingFee : Number(raw.shippingFee || 0)
  const totalAmount = typeof raw.totalAmount === 'number' ? raw.totalAmount : Number(raw.totalAmount || subtotal + shippingFee)

  return {
    id: raw.id,
    orderNumber: raw.orderNumber || `ORD-${raw.id}`,
    userId: raw.userId,
    customerName: raw.customerName || '',
    customerEmail: raw.customerEmail || '',
    totalAmount,
    subtotal,
    discountAmount,
    shippingFee,
    orderStatus: raw.orderStatus || 'PLACED',
    paymentStatus: raw.paymentStatus || 'PENDING',
    paymentMethod: raw.paymentMethod || 'CASH_ON_DELIVERY',
    shippingAddress: raw.shippingAddress || '',
    items,
    totalItems: raw.totalItems != null ? raw.totalItems : items.reduce((acc, i) => acc + i.quantity, 0),
    createdAt: raw.createdAt || new Date().toISOString(),
  }
}

export const orderService = {
  /**
   * Create order from current user cart with authoritative backend calculation.
   * @param {Object} data { fullName, phone, address, city, state, postalCode, paymentMethod }
   */
  async createOrder(data) {
    const res = await apiClient.post('/orders', data)
    return normalizeOrder(res.data?.data)
  },

  /**
   * Get user orders with pagination.
   */
  async getOrders(page = 0, size = 10) {
    const res = await apiClient.get(`/orders?page=${page}&size=${size}`)
    const pageData = res.data?.data
    if (!pageData) {
      return { content: [], totalElements: 0, totalPages: 0 }
    }
    return {
      ...pageData,
      content: (pageData.content || []).map(normalizeOrder),
    }
  },

  /**
   * Get specific order details by ID or orderNumber.
   */
  async getOrderById(id) {
    const res = await apiClient.get(`/orders/${id}`)
    return normalizeOrder(res.data?.data)
  },

  /**
   * Get order tracking information with visual status timeline.
   */
  async getOrderTracking(id) {
    const res = await apiClient.get(`/orders/${id}/tracking`)
    const raw = res.data?.data
    if (!raw) return null

    const baseOrder = normalizeOrder(raw)
    return {
      ...baseOrder,
      orderId: raw.orderId || baseOrder.id,
      currentStatus: raw.currentStatus || baseOrder.orderStatus,
      currentStepIndex: raw.currentStepIndex != null ? raw.currentStepIndex : 0,
      isDelivered: !!raw.delivered,
      isCancelled: !!raw.cancelled,
      timeline: (raw.timeline || []).map((step) => ({
        status: step.status,
        title: step.title,
        description: step.description,
        timestamp: step.timestamp,
        state: step.state || 'UPCOMING', // COMPLETED, CURRENT, UPCOMING
      })),
    }
  },

  /**
   * Update order status (Admin operation).
   */
  async updateOrderStatus(id, status) {
    const res = await apiClient.patch(`/admin/orders/${id}/status`, { status })
    return normalizeOrder(res.data?.data)
  },

  /**
   * Get paginated orders for admin with search keyword, status filter, and sorting.
   */
  async getAdminOrders({ keyword = '', status = '', page = 0, size = 10, sortBy = 'createdAt', sortDir = 'desc' } = {}) {
    const params = new URLSearchParams()
    if (keyword && keyword.trim()) params.append('keyword', keyword.trim())
    if (status && status !== 'All' && status !== 'ALL') params.append('status', status.trim())
    params.append('page', page)
    params.append('size', size)
    params.append('sortBy', sortBy)
    params.append('sortDir', sortDir)

    const res = await apiClient.get(`/admin/orders?${params.toString()}`)
    const pageData = res.data?.data
    if (!pageData) {
      return { content: [], totalElements: 0, totalPages: 0, pageNumber: 0 }
    }
    return {
      ...pageData,
      content: (pageData.content || []).map(normalizeOrder),
    }
  },

  /**
   * Get order status counts and metrics for admin.
   */
  async getAdminOrderStats() {
    const res = await apiClient.get('/admin/orders/stats')
    return res.data?.data || {}
  },

  /**
   * Get single order details for admin.
   */
  async getAdminOrderById(id) {
    const res = await apiClient.get(`/admin/orders/${id}`)
    return normalizeOrder(res.data?.data)
  },
}

