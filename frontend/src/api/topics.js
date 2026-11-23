import { apiClient } from './client' // adds "/api" and unwraps { data }

const send = (method, body) => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
})

export const topicsApi = {
  // topics for the form, each with how many others can help: [{ id, name, helperCount }]
  skills: () => apiClient('/topics/skills'),
  // body: { title, description, skillIds, priority, visibility } -> { ticketId, ticketNo, helperCount }
  create: (body) => apiClient('/topics/requests', send('POST', body)),

  // topics of one ticket: [{ id, name }]
  topicsOf: (ticketId) => apiClient(`/topics/requests/${ticketId}/topics`),
  // admin: { nobodyHasSkill, users: [{ id, fullName, declined }] }
  helpers: (ticketId) => apiClient(`/topics/requests/${ticketId}/helpers`),

  // "Questions you can help with" and its number for the navbar
  queue: () => apiClient('/topics/queue'),
  queueCount: () => apiClient('/topics/queue/count'),

  // learning links on a ticket
  links: (ticketId) => apiClient(`/tickets/${ticketId}/links`),
  addLink: (ticketId, body) => apiClient(`/tickets/${ticketId}/links`, send('POST', body)), // { title, url, kind }
  removeLink: (ticketId, linkId) => apiClient(`/tickets/${ticketId}/links/${linkId}`, send('DELETE')),
}