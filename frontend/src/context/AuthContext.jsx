import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { authService } from '@/services/authService'
import { toast } from 'react-hot-toast'

const AuthContext = createContext(null)

/**
 * Safely parses the claims payload of a standard JWT token.
 */
function parseJwt(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.warn('ShopSphere Auth: Failed to parse JWT claims:', e)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('shopsphere_token') || null)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('shopsphere_user')
      let parsed = saved ? JSON.parse(saved) : null
      const storedToken = localStorage.getItem('shopsphere_token')

      if (storedToken) {
        const claims = parseJwt(storedToken)
        if (claims) {
          parsed = {
            ...(parsed || {}),
            id: parsed?.id || claims.userId,
            email: parsed?.email || claims.sub,
            name: parsed?.name || (claims.sub ? claims.sub.split('@')[0] : 'User'),
            role: parsed?.role || claims.role || 'CUSTOMER',
          }
        }
      }
      return parsed
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  // Verify and sync profile on initial load if token exists
  useEffect(() => {
    async function syncAuth() {
      const storedToken = localStorage.getItem('shopsphere_token')
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const profile = await authService.getProfile()
        if (profile) {
          const claims = parseJwt(storedToken)
          const merged = {
            ...profile,
            id: profile.id || claims?.userId,
            role: profile.role || claims?.role || 'CUSTOMER',
          }
          setUser(merged)
          localStorage.setItem('shopsphere_user', JSON.stringify(merged))
        }
      } catch (err) {
        // Only invalidate credentials if explicitly unauthorized/forbidden by the server
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('shopsphere_token')
          localStorage.removeItem('shopsphere_user')
          setToken(null)
          setUser(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    syncAuth()

    const handleLogoutEvent = () => {
      setToken(null)
      setUser(null)
      toast.error('Session expired. Please log in again.')
    }

    window.addEventListener('shopsphere_auth_logout', handleLogoutEvent)
    return () => window.removeEventListener('shopsphere_auth_logout', handleLogoutEvent)
  }, [])

  const login = async (email, password) => {
    const data = await authService.login({ email, password })
    const claims = parseJwt(data.token)
    const userObj = {
      ...(data.user || {}),
      id: data.user?.id || claims?.userId,
      role: data.user?.role || claims?.role || 'CUSTOMER',
    }
    setToken(data.token)
    setUser(userObj)
    localStorage.setItem('shopsphere_token', data.token)
    localStorage.setItem('shopsphere_user', JSON.stringify(userObj))
    return { ...data, user: userObj }
  }

  const register = async (userData) => {
    const data = await authService.register(userData)
    const claims = parseJwt(data.token)
    const userObj = {
      ...(data.user || {}),
      id: data.user?.id || claims?.userId,
      role: data.user?.role || claims?.role || 'CUSTOMER',
    }
    setToken(data.token)
    setUser(userObj)
    localStorage.setItem('shopsphere_token', data.token)
    localStorage.setItem('shopsphere_user', JSON.stringify(userObj))
    return { ...data, user: userObj }
  }

  const logout = async () => {
    await authService.logout()
    setToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateProfile = async (profileData) => {
    const updated = await authService.updateProfile(profileData)
    const merged = {
      ...(user || {}),
      ...updated,
    }
    setUser(merged)
    localStorage.setItem('shopsphere_user', JSON.stringify(merged))
    return merged
  }

  const changePassword = async (passwords) => {
    return await authService.changePassword(passwords)
  }

  const userRole = (user?.role || '').toUpperCase()
  const isAdmin = !!user && (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN')

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      isAdmin,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
    }),
    [user, token, isLoading, isAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
