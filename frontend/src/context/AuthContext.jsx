import React, { createContext, useContext, useState } from 'react'
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

  // Stores session. Used by password login and Google login.
  const completeLogin = (data) => {
    setToken(data.accessToken)
    setUser(data.user)
    localStorage.setItem('fixhub_token', data.accessToken)
    localStorage.setItem('fixhub_user', JSON.stringify(data.user))
    return data.user
  }

  const login = async (credentials) => completeLogin(await apiLogin(credentials))

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
    completeLogin,
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