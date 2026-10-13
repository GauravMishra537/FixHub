export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`
  const token = localStorage.getItem('fixhub_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMsg = result?.message || `Request failed with status ${response.status}`
    throw new Error(errorMsg)
  }

  return result?.data ?? result
}
