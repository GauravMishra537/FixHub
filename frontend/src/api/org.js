import { apiClient } from './client'

// client.js adds "/api" and already unwraps { data }.
const send = (method, body) => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
})

export const orgApi = {
  // departments (admin)
  departments: () => apiClient('/admin/departments'),
  createDepartment: (name) => apiClient('/admin/departments', send('POST', { name })),
  updateDepartment: (id, body) => apiClient(`/admin/departments/${id}`, send('PUT', body)),
  deleteDepartment: (id) => apiClient(`/admin/departments/${id}`, send('DELETE')),

  // skill catalog
  activeSkills: () => apiClient('/skills'),
  adminSkills: () => apiClient('/admin/skills'),
  createSkill: (name) => apiClient('/admin/skills', send('POST', { name })),
  updateSkill: (id, body) => apiClient(`/admin/skills/${id}`, send('PUT', body)),
  deleteSkill: (id) => apiClient(`/admin/skills/${id}`, send('DELETE')),

  // skill review (admin)
  skillRequests: (status) => apiClient(`/admin/skill-requests?status=${status}`),
  approveSkill: (id) => apiClient(`/admin/skill-requests/${id}/approve`, send('POST')),
  rejectSkill: (id, reason) => apiClient(`/admin/skill-requests/${id}/reject`, send('POST', { reason })),
  removeUserSkill: (userId, userSkillId) =>
    apiClient(`/admin/users/${userId}/skills/${userSkillId}`, send('DELETE')),

  // admin sets a user's details
  getProfile: (userId) => apiClient(`/admin/users/${userId}/profile`),
  updateProfile: (userId, body) => apiClient(`/admin/users/${userId}/profile`, send('PUT', body)),
  approveRegistration: (requestId, body) =>
    apiClient(`/admin/requests/${requestId}/approve`, send('PUT', body ?? undefined)),

  // user's own skills
  mySkills: () => apiClient('/account/skills'),
  requestSkill: (body) => apiClient('/account/skills', send('POST', body)),
  removeMySkill: (id) => apiClient(`/account/skills/${id}`, send('DELETE')),
  updateMyProfile: (body) => apiClient('/account/profile', send('PUT', body)),
  // audit logs (admin)
  auditLogs: ({ eventType, userId, page = 0, size = 20 }) => {
    const params = new URLSearchParams({ page, size })
    if (eventType) params.set('eventType', eventType)
    if (userId) params.set('userId', userId)
    return apiClient(`/admin/audit-logs?${params.toString()}`)
  },
}