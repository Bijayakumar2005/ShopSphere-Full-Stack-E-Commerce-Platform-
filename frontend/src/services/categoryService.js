import apiClient from './apiClient'

/**
 * Category API service communicating with Spring Boot /api/categories endpoints.
 */
export const categoryService = {
  /**
   * Fetch all categories with real product counts.
   */
  async getCategories() {
    const response = await apiClient.get('/categories')
    return response.data?.data || []
  },

  /**
   * Fetch a single category by ID.
   */
  async getCategoryById(id) {
    const response = await apiClient.get(`/categories/${id}`)
    return response.data?.data
  },

  /**
   * Admin: Create a new category.
   * @param {{ name: string, slug?: string, icon?: string, description?: string }} data
   */
  async createCategory(data) {
    const payload = {
      name: data.name?.trim(),
      slug: data.slug?.trim() || undefined,
      icon: data.icon?.trim() || '📁',
      description: data.description?.trim() || undefined,
    }
    const response = await apiClient.post('/categories', payload)
    return response.data?.data
  },

  /**
   * Admin: Update an existing category.
   * @param {number|string} id
   * @param {{ name: string, slug?: string, icon?: string, description?: string }} data
   */
  async updateCategory(id, data) {
    const payload = {
      name: data.name?.trim(),
      slug: data.slug?.trim() || undefined,
      icon: data.icon?.trim() || undefined,
      description: data.description?.trim() || undefined,
    }
    const response = await apiClient.put(`/categories/${id}`, payload)
    return response.data?.data
  },

  /**
   * Admin: Delete a category (only if 0 products attached).
   * @param {number|string} id
   */
  async deleteCategory(id) {
    const response = await apiClient.delete(`/categories/${id}`)
    return response.data
  },
}

export default categoryService
