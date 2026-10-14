import { apiClient } from './client'

export async function getAdminOverview() {
  return apiClient('/admin/overview')
}

export async function getPendingUsers() {
  return apiClient('/admin/pending-users')
}

export async function getAllUsers(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiClient(`/admin/users${query}`)
}

export async function approveUser(id) {
  return apiClient(`/admin/users/${id}/approve`, { method: 'PUT' })
}

export async function rejectUser(id, reason) {
  return apiClient(`/admin/users/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  })
}

export async function suspendUser(id) {
  return apiClient(`/admin/users/${id}/suspend`, { method: 'PUT' })
}

export async function restoreUser(id) {
  return apiClient(`/admin/users/${id}/restore`, { method: 'PUT' })
}