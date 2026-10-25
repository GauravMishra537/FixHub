import { apiClient } from './client'

// client.js adds "/api" and already unwraps { data }.
export const ticketHistoryApi = {
  list: ({ action, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams({ page, size })
    if (action) params.set('action', action)
    return apiClient(`/admin/ticket-history?${params.toString()}`)
  },
  actions: () => apiClient('/admin/ticket-history/actions'),
}