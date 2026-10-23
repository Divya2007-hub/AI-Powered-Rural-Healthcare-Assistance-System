import { apiFetch } from './client.js'

export function assessSymptoms(payload, { signal } = {}) {
  return apiFetch(
    '/triage/symptoms',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { signal },
  )
}
