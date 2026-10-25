import { apiClient } from './client'

// client.js adds "/api" and already unwraps { data }.
const send = (method, body) => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
})

export const routingApi = {
  list: () => apiClient('/admin/routing-rules'),
  create: (body) => apiClient('/admin/routing-rules', send('POST', body)),
  update: (id, body) => apiClient(`/admin/routing-rules/${id}`, send('PUT', body)),
  remove: (id) => apiClient(`/admin/routing-rules/${id}`, send('DELETE')),
}