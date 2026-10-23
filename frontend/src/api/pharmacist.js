import { apiFetch } from './client.js'

function jsonOptions(method, payload) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

export function listPharmacyStock({ signal } = {}) {
  return apiFetch('/pharmacist/stock', { method: 'GET' }, { signal })
}

export function createPharmacyStock(payload) {
  return apiFetch('/pharmacist/stock', jsonOptions('POST', payload))
}

export function updatePharmacyStock(stockId, payload) {
  return apiFetch(`/pharmacist/stock/${stockId}`, jsonOptions('PATCH', payload))
}

export function deletePharmacyStock(stockId) {
  return apiFetch(`/pharmacist/stock/${stockId}`, { method: 'DELETE' })
}
