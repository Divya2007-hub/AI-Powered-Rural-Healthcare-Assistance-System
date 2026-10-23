import { apiFetch } from './client.js'

export function listNearbyFacilities(filters = {}, { signal } = {}) {
  const params = new URLSearchParams()

  if (filters.city) params.set('city', filters.city.trim())
  if (filters.type) params.set('type', filters.type)
  if (filters.emergencyOnly) params.set('emergency_only', 'true')
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.lat != null && filters.lng != null) {
    params.set('lat', String(filters.lat))
    params.set('lng', String(filters.lng))
  }
  if (filters.radiusKm) params.set('radius_km', String(filters.radiusKm))

  const query = params.toString()

  return apiFetch(`/facilities/nearby${query ? `?${query}` : ''}`, { method: 'GET' }, { signal })
}
