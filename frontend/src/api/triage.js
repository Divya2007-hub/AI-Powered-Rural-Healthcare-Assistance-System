const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

async function readError(response) {
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

export async function assessSymptoms(payload, { signal } = {}) {
  const response = await fetch(`${API_BASE_URL}/triage/symptoms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return response.json()
}
