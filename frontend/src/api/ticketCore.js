import { apiClient } from './client'

const json = (method, data) => ({ method, body: JSON.stringify(data) })

// builds ?a=1&b=2. skips empty values. arrays repeat the key: status=NEW&status=OPEN
const qs = (obj) => {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((x) => p.append(k, x))
    } else if (v !== undefined && v !== null && v !== '') {
      p.append(k, v)
    }
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const ticketCoreApi = {
  create: (data) => apiClient('/tickets', json('POST', data)),

  // search, filter, sort, page. params = output of toApiParams() in useTicketFilters
  search: (params) => apiClient(`/tickets${qs(params)}`),

  // kept for older screens. new code uses search()
  list: (page = 0, size = 10) => apiClient(`/tickets${qs({ page, size })}`),
  mine: (group, page = 0, size = 5) => apiClient(`/tickets/mine${qs({ group, page, size })}`),
  departmentQueue: ({ page = 0, size = 10 } = {}) =>
  apiClient(`/tickets/department-queue?${new URLSearchParams({ page, size }).toString()}`),
  
    categoryCounts: (type = 'ISSUE') => apiClient(`/tickets/category-counts${qs({ type })}`),
  summary: () => apiClient('/tickets/summary'),
  get: (id) => apiClient(`/tickets/${id}`),
  update: (id, data) => apiClient(`/tickets/${id}`, json('PUT', data)),
  history: (id) => apiClient(`/tickets/${id}/history`),

  // q is always sent, even empty, so backend returns the 8 typing suggestions
  suggestCategories: (type, q) =>
    apiClient(`/ticket-categories?type=${encodeURIComponent(type)}&q=${encodeURIComponent(q || '')}`),
}