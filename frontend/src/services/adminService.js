import apiClient from './apiClient'

export const adminService = {
  /**
   * Retrieves dashboard statistics and summary metrics.
   * @returns {Promise<object>}
   */
  async getDashboardStats() {
    try {
      const response = await apiClient.get('/admin/dashboard')
      if (response.data && response.data.data) {
        return response.data.data
      }
      return response.data
    } catch (error) {
      console.warn('Failed to fetch admin dashboard stats from API, using fallback data:', error)
      throw error
    }
  },
}

export default adminService
