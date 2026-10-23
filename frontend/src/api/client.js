import { getToken } from './token.js'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
).replace(/\/$/, '')

export async function readError(response) {
  try {
    const body = await response.json()
    const detail = body?.detail
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).filter(Boolean).join('; ')
    }
    if (typeof detail === 'string') return detail
  } catch {
    // Fall through to a generic message when the body is not JSON.
  }
  return `The server could not process the request (${response.status}).`
}

export async function apiFetch(path, options = {}, { signal } = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
