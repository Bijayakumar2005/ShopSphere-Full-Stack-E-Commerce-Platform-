import apiClient from './apiClient'

export const authService = {
  /**
   * Register a new customer
   */
  async register(userData) {
    const response = await apiClient.post('/auth/register', userData)
    return response.data.data
  },

  /**
   * Login customer or admin
   */
  async login(credentials) {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data.data
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Best-effort server notification
    } finally {
      localStorage.removeItem('shopsphere_token')
      localStorage.removeItem('shopsphere_user')
    }
  },

  /**
   * Fetch current user's profile
   */
  async getProfile() {
    const response = await apiClient.get('/users/profile')
    return response.data.data
  },

  /**
   * Update current user's profile
   */
  async updateProfile(profileData) {
    const response = await apiClient.put('/users/profile', profileData)
    return response.data.data
  },

  /**
   * Change current user's password
   */
  async changePassword(passwordData) {
    const response = await apiClient.put('/users/change-password', passwordData)
    return response.data
  },
}
