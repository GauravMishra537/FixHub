import { apiClient } from './client'

// client.js adds "/api" and unwraps { data }.
const send = (method, body) => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
})

export const ticketApi = {
  // admin
  adminCategories: (type) =>
    apiClient(`/admin/ticket-categories${type ? `?type=${type}` : ''}`),
  createCategory: (body) => apiClient('/admin/ticket-categories', send('POST', body)),
  updateCategory: (id, body) => apiClient(`/admin/ticket-categories/${id}`, send('PUT', body)),
  deleteCategory: (id) => apiClient(`/admin/ticket-categories/${id}`, send('DELETE')),

  // any logged in user (create ticket form, Commit 13)
  activeCategories: (type) => apiClient(`/ticket-categories?type=${type}`),
}

export const TICKET_TYPES = [
  { key: 'ISSUE', label: 'Issue' },
  { key: 'ROOM_BOOKING', label: 'Infra booking' },
  { key: 'RESOURCE_REQUEST', label: 'Resource request' },
  { key: 'TOPIC_REQUEST', label: 'Topic request' },
]