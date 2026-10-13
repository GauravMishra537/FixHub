import { apiClient } from './client'

export async function register(data) {
  return apiClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function login(credentials) {
  return apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export async function logout() {
  return apiClient('/auth/logout', {
    method: 'POST',
  })
}

export async function getCurrentUser() {
  return apiClient('/auth/me')
}

export async function verifyEmail(token) {
  return apiClient('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function resendVerification(email) {
  return apiClient('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}
