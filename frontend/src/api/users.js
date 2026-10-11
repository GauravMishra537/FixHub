import { apiClient } from './client'

export async function getUsers() {
  return apiClient('/users')
}

export async function getUserById(id) {
  return apiClient(`/users/${id}`)
}

export async function createUser(userData) {
  return apiClient('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}
