import { apiClient } from './client'

export async function getSystemInfo() {
  return apiClient('/system/info')
}
