import { apiClient } from './client'

export async function getAdminOverview() {
  return apiClient('/admin/overview')
}

export async function getPendingUsers() {
  return apiClient('/admin/pending-users')
}

export async function getAllUsers() {
  return apiClient('/admin/users')
}
