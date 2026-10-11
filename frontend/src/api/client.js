export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMsg = result?.message || `Request failed with status ${response.status}`
    throw new Error(errorMsg)
  }

  return result?.data ?? result
}
