import { apiFetch } from './client.js'

export function searchMedicineAvailability(filters = {}, { signal } = {}) {
  const params = new URLSearchParams()

  if (filters.medicine) params.set('medicine', filters.medicine.trim())
  if (filters.city) params.set('city', filters.city.trim())
  if (filters.inStock === true) params.set('in_stock', 'true')
  if (filters.inStock === false) params.set('in_stock', 'false')
  if (filters.limit) params.set('limit', String(filters.limit))

  const query = params.toString()

  return apiFetch(`/medicines/availability${query ? `?${query}` : ''}`, { method: 'GET' }, { signal })
}
