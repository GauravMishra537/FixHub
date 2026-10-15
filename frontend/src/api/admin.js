import { apiClient } from './client';

export const getRequests = (status) =>
  apiClient(status ? `/admin/requests?status=${status}` : '/admin/requests');

export const getUsers = () => apiClient('/admin/users');

export const approveRequest = (id) =>
  apiClient(`/admin/requests/${id}/approve`, { method: 'PUT' });

export const rejectRequest = (id, reason) =>
  apiClient(`/admin/requests/${id}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });

export const deleteUser = (id) =>
  apiClient(`/admin/users/${id}`, { method: 'DELETE' });