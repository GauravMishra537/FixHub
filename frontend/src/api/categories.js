import { apiClient } from './client'

export const categoryConsoleApi = {
  list: (type) => apiClient(`/admin/category-console${type ? `?type=${type}` : ''}`),
  rename: (id, name) =>
    apiClient(`/admin/category-console/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  setActive: (id, active) =>
    apiClient(`/admin/category-console/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  merge: (id, targetId) =>
    apiClient(`/admin/category-console/${id}/merge`, { method: 'POST', body: JSON.stringify({ targetId }) }),
}