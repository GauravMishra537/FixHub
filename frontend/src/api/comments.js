import { apiClient } from './client'

export const commentApi = {
  list: (ticketId) => apiClient(`/tickets/${ticketId}/comments`),
  add: (ticketId, body) =>
    apiClient(`/tickets/${ticketId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),
  remove: (ticketId, commentId) =>
    apiClient(`/tickets/${ticketId}/comments/${commentId}`, { method: 'DELETE' }),
}