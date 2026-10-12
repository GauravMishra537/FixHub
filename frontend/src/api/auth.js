import { apiClient } from './client'

export async function register(data) {
  return apiClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
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
