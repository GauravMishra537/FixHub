import { apiClient } from './client' // adds "/api" and unwraps { data }

const send = (method, body) => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
})

export const resourcesApi = {
  // ---- users: /api/resources ----
  catalog: () => apiClient('/resources/catalog'),
  create: (body) => apiClient('/resources/requests', send('POST', body)),
  details: (ticketId) => apiClient(`/resources/tickets/${ticketId}`),
  updateSettings: (ticketId, body) => apiClient(`/resources/tickets/${ticketId}/settings`, send('PATCH', body)),
  approvals: () => apiClient('/resources/approvals'),
  approvalCount: () => apiClient('/resources/approvals/count'),

  // ---- admin: /api/admin/resources ----
  adminCategories: () => apiClient('/admin/resources/categories'),
  createCategory: (body) => apiClient('/admin/resources/categories', send('POST', body)),
  updateCategory: (id, body) => apiClient(`/admin/resources/categories/${id}`, send('PUT', body)),
  deleteCategory: (id) => apiClient(`/admin/resources/categories/${id}`, send('DELETE')),

  adminItems: (categoryId) => apiClient(`/admin/resources/categories/${categoryId}/items`),
  createItem: (body) => apiClient('/admin/resources/items', send('POST', body)),
  updateItem: (id, body) => apiClient(`/admin/resources/items/${id}`, send('PUT', body)),
  deleteItem: (id) => apiClient(`/admin/resources/items/${id}`, send('DELETE')),

  adminApprovers: () => apiClient('/admin/resources/approvers'),
  setApprover: (departmentId, userId) =>
    apiClient(`/admin/resources/approvers/${departmentId}`, send('PUT', { userId })),
  clearApprover: (departmentId) => apiClient(`/admin/resources/approvers/${departmentId}`, send('DELETE')),
  members: (departmentId) => apiClient(`/admin/resources/departments/${departmentId}/members`),
}