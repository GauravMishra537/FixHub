import { apiClient } from './client'

// client.js adds "/api" and unwraps { data }.
const send = (method, body) => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
})

// a Date or an ISO text, the server wants an ISO instant like 2026-11-02T04:30:00.000Z
const iso = (v) => (v instanceof Date ? v.toISOString() : v)

export const infraApi = {
  // any logged in user
  types: () => apiClient('/infra/types'),

  // free units of one kind for one window, fitted to the headcount
  availability: ({ infraTypeId, start, end, headcount, includeBigger = false }) => {
    const q = new URLSearchParams({
      infraTypeId,
      start: iso(start),
      end: iso(end),
      headcount,
      includeBigger,
    })
    return apiClient(`/infra/availability?${q}`)
  },

  // body: { infraTypeId, title, note, headcount, sessions: [{ infrastructureId, startTime, endTime, allDay, reason }] }
  book: (body) => apiClient('/infra/bookings', send('POST', body)),

  // the sessions card on the ticket page
  sessions: (ticketId) => apiClient(`/infra/tickets/${ticketId}/sessions`),

    // booked and empty units of one kind between two instants (one day)
  board: ({ infraTypeId, from, to }) => {
    const q = new URLSearchParams({ infraTypeId, from: iso(from), to: iso(to) })
    return apiClient(`/infra/board?${q}`)
  },
  
  // admin console
  adminTypes: () => apiClient('/admin/infra/types'),
  createType: (body) => apiClient('/admin/infra/types', send('POST', body)),
  updateType: (id, body) => apiClient(`/admin/infra/types/${id}`, send('PUT', body)),
  deleteType: (id) => apiClient(`/admin/infra/types/${id}`, send('DELETE')),

  units: (typeId) => apiClient(`/admin/infra/types/${typeId}/units`),
  createUnit: (body) => apiClient('/admin/infra/units', send('POST', body)),
  updateUnit: (id, body) => apiClient(`/admin/infra/units/${id}`, send('PUT', body)),
  deleteUnit: (id) => apiClient(`/admin/infra/units/${id}`, send('DELETE')),

  // admin cancels one session with a reason
  cancelSession: (bookingId, note) =>
    apiClient(`/admin/infra/bookings/${bookingId}/cancel`, send('POST', { note })),
}