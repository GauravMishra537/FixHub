import { apiClient } from './client'

// client.js adds "/api" and already unwraps { data }.
export const notificationApi = {
  list: ({ page = 0, size = 10 } = {}) =>
    apiClient(`/notifications?${new URLSearchParams({ page, size }).toString()}`),
  unreadCount: () => apiClient('/notifications/unread-count'),
  markRead: (id) => apiClient(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiClient('/notifications/read-all', { method: 'POST' }),
  clearAll: () => apiClient('/notifications', { method: 'DELETE' }),
}