import React, { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fixhub_token'))
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fixhub_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = async (credentials) => {
    const data = await apiLogin(credentials)
    const accessToken = data.accessToken
    const userProfile = data.user

    setToken(accessToken)
    setUser(userProfile)
    localStorage.setItem('fixhub_token', accessToken)
    localStorage.setItem('fixhub_user', JSON.stringify(userProfile))

    return userProfile
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // Ignore network errors on logout
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('fixhub_token')
      localStorage.removeItem('fixhub_user')
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
