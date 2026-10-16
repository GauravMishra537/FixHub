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

export async function forgotPassword(email) {
  return apiClient('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(token, newPassword) {
  return apiClient('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  })
}

export async function setPassword(newPassword) {
  return apiClient('/account/set-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  })
}

export async function changePassword(currentPassword, newPassword) {
  return apiClient('/account/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}