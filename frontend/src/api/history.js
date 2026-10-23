import { apiFetch } from './client.js'

export function listTriageHistory(limit = 50, { signal } = {}) {
  return apiFetch(`/history/triage?limit=${limit}`, { method: 'GET' }, { signal })
}

export function deleteTriageHistory(historyId) {
  return apiFetch(`/history/triage/${historyId}`, { method: 'DELETE' })
}
