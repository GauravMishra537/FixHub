import { apiClient } from './client'

const json = (method, data) => ({ method, body: JSON.stringify(data) })

const qs = (obj) => {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.append(k, v)
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const ticketCoreApi = {
  create: (data) => apiClient('/tickets', json('POST', data)),
  list: (page = 0, size = 10) => apiClient(`/tickets${qs({ page, size })}`),
  mine: (group, page = 0, size = 5) => apiClient(`/tickets/mine${qs({ group, page, size })}`),
  summary: () => apiClient('/tickets/summary'),
  get: (id) => apiClient(`/tickets/${id}`),
  update: (id, data) => apiClient(`/tickets/${id}`, json('PUT', data)),
  history: (id) => apiClient(`/tickets/${id}/history`),
  // q is always sent, even empty, so backend returns the 8 typing suggestions
  suggestCategories: (type, q) =>
    apiClient(`/ticket-categories?type=${encodeURIComponent(type)}&q=${encodeURIComponent(q || '')}`),
}