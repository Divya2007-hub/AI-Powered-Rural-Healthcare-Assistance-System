import { useEffect, useRef, useState } from 'react'
import { listNearbyFacilities } from '../../api/facilities.js'

const FACILITY_TYPES = [
  { value: '', label: 'All facility types' },
  { value: 'PHC', label: 'Primary Health Centre (PHC)' },
  { value: 'CHC', label: 'Community Health Centre (CHC)' },
  { value: 'Hospital', label: 'Hospital' },
  { value: 'Pharmacy', label: 'Pharmacy' },
]

function phoneHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export default function NearbyHealthcare({ onBack }) {
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const [facilities, setFacilities] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const requestRef = useRef(null)

  const load = async (filters) => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setStatus('loading')
    setError('')

    try {
      const data = await listNearbyFacilities(filters, { signal: controller.signal })
      setFacilities(data.facilities)
      setStatus('idle')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(
        err.message ||
          'We could not load nearby healthcare facilities. Check your connection and try again.',
      )
      setFacilities([])
      setStatus('error')
    }
  }

  useEffect(() => {
    load({ limit: 50 })
    return () => requestRef.current?.abort()
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    load({ city, type, emergencyOnly, limit: 50 })
  }

  const clearFilters = () => {
    setCity('')
    setType('')
    setEmergencyOnly(false)
    load({ limit: 50 })
  }

  return (
    <section className="facilities" aria-labelledby="facilities-title">
      <div className="triage-intro">
        <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
          &larr; Back to home
        </button>
        <h1 id="facilities-title">Nearby Healthcare</h1>
        <p className="triage-lead">
          Find primary health centres, community health centres, hospitals and pharmacies near you.
          Call ahead to confirm timings and services.
        </p>
      </div>

      <form className="facilities-filters" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="facility-city">Village, town or city</label>
          <input
            id="facility-city"
            name="city"
            type="search"
            placeholder="e.g. Rampur"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="facility-type">Facility type</label>
          <select
            id="facility-type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {FACILITY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field field-checkbox">
          <input
            id="facility-emergency"
            name="emergency"
            type="checkbox"
            checked={emergencyOnly}
            onChange={(event) => setEmergencyOnly(event.target.checked)}
          />
          <label htmlFor="facility-emergency">Emergency services or 24x7 only</label>
        </div>

        <div className="facilities-filter-actions">
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          <button type="button" className="btn btn-outline" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      <div className="facilities-results" aria-live="polite">
        {status === 'loading' && (
          <p className="facilities-status" role="status">
            Loading healthcare facilities…
          </p>
        )}

        {status === 'error' && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {status === 'idle' && facilities.length === 0 && (
          <div className="result-placeholder">
            <h2>No facilities found</h2>
            <p>Try a different village, town or city, or clear the filters.</p>
          </div>
        )}

        {status === 'idle' && facilities.length > 0 && (
          <>
            <p className="facilities-count">
              Showing {facilities.length} {facilities.length === 1 ? 'facility' : 'facilities'}
            </p>
            <ul className="facility-list">
              {facilities.map((facility) => (
                <li key={facility.id} className="facility-card">
                  <div className="facility-head">
                    <h2>{facility.name}</h2>
                    <span className={`facility-type type-${facility.type.toLowerCase()}`}>
                      {facility.type}
                    </span>
                  </div>

                  <p className="facility-address">
                    {facility.address}, {facility.city}, {facility.state}
                  </p>

                  <div className="facility-meta">
                    {facility.distance_km !== null && (
                      <span className="facility-distance">{facility.distance_km} km away</span>
                    )}
                    {facility.open_24x7 && <span className="facility-badge">Open 24x7</span>}
                    {facility.emergency_services && (
                      <span className="facility-badge is-emergency">Emergency services</span>
                    )}
                  </div>

                  {facility.phone && (
                    <a className="facility-phone" href={phoneHref(facility.phone)}>
                      Call {facility.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="safety-note">
        Listings are demo data for development. In an emergency, call your local emergency number.
      </p>
    </section>
  )
}
