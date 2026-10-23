import { useEffect, useRef, useState } from 'react'
import { listNearbyFacilities } from '../../api/facilities.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

const FACILITY_TYPES = [
  { value: '', labelKey: 'nearby.allTypes' },
  { value: 'PHC', labelKey: 'facilityType.PHC' },
  { value: 'CHC', labelKey: 'facilityType.CHC' },
  { value: 'Hospital', labelKey: 'facilityType.Hospital' },
  { value: 'Pharmacy', labelKey: 'facilityType.Pharmacy' },
]

function facilityTypeLabel(type, t) {
  const key = `facilityType.${type}`
  const translated = t(key)
  return translated === key ? type : translated
}

function phoneHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export default function NearbyHealthcare({ onBack }) {
  const { t } = useI18n()
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [emergencyOnly, setEmergencyOnly] = useState(false)
  const [facilities, setFacilities] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const requestRef = useRef(null)

  const load = async (filters, location = coords) => {
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setStatus('loading')
    setError('')

    const withLocation = location
      ? { ...filters, lat: location.lat, lng: location.lng }
      : filters

    try {
      const data = await listNearbyFacilities(withLocation, { signal: controller.signal })
      setFacilities(data.facilities)
      setStatus('idle')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || t('nearby.error'))
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

  const useMyLocation = () => {
    setGeoError('')

    if (!navigator.geolocation) {
      setGeoError(t('nearby.geoUnsupported'))
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCoords(next)
        setLocating(false)
        load({ city, type, emergencyOnly, limit: 50 }, next)
      },
      (err) => {
        setLocating(false)
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? t('nearby.geoDenied')
            : t('nearby.geoError'),
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }

  return (
    <section className="facilities" aria-labelledby="facilities-title">
      <div className="triage-intro">
        <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
          {t('common.backHome')}
        </button>
        <h1 id="facilities-title">{t('nearby.title')}</h1>
        <p className="triage-lead">{t('nearby.lead')}</p>
      </div>

      <div className="location-bar">
        <button
          type="button"
          className="btn btn-outline"
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? t('nearby.locating') : t('nearby.useLocation')}
        </button>
        {coords && !geoError && (
          <p className="location-status" role="status">
            {t('nearby.locationActive')}
          </p>
        )}
        {geoError && (
          <p className="form-error" role="alert">
            {geoError}
          </p>
        )}
      </div>

      <form className="facilities-filters" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="facility-city">{t('nearby.cityLabel')}</label>
          <input
            id="facility-city"
            name="city"
            type="search"
            placeholder={t('nearby.cityPlaceholder')}
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="facility-type">{t('nearby.typeLabel')}</label>
          <select
            id="facility-type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {FACILITY_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
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
          <label htmlFor="facility-emergency">{t('nearby.emergencyOnly')}</label>
        </div>

        <div className="facilities-filter-actions">
          <button type="submit" className="btn btn-primary">
            {t('common.search')}
          </button>
          <button type="button" className="btn btn-outline" onClick={clearFilters}>
            {t('common.clear')}
          </button>
        </div>
      </form>

      <div className="facilities-results" aria-live="polite">
        {status === 'loading' && (
          <p className="facilities-status" role="status">
            {t('nearby.loading')}
          </p>
        )}

        {status === 'error' && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {status === 'idle' && facilities.length === 0 && (
          <div className="result-placeholder">
            <h2>{t('nearby.emptyTitle')}</h2>
            <p>{t('nearby.emptyBody')}</p>
          </div>
        )}

        {status === 'idle' && facilities.length > 0 && (
          <>
            <p className="facilities-count">
              {facilities.length === 1
                ? t('nearby.showingOne')
                : t('nearby.showingMany', { count: facilities.length })}
            </p>
            <ul className="facility-list">
              {facilities.map((facility) => (
                <li key={facility.id} className="facility-card">
                  <div className="facility-head">
                    <h2>{facility.name}</h2>
                    <span className={`facility-type type-${facility.type.toLowerCase()}`}>
                      {facilityTypeLabel(facility.type, t)}
                    </span>
                  </div>

                  <p className="facility-address">
                    {facility.address}, {facility.city}, {facility.state}
                  </p>

                  <div className="facility-meta">
                    {facility.distance_km !== null && (
                      <span className="facility-distance">
                        {t('common.kmAway', { distance: facility.distance_km })}
                      </span>
                    )}
                    {facility.open_24x7 && (
                      <span className="facility-badge">{t('nearby.open24')}</span>
                    )}
                    {facility.emergency_services && (
                      <span className="facility-badge is-emergency">
                        {t('nearby.emergencyBadge')}
                      </span>
                    )}
                  </div>

                  <div className="facility-actions">
                    {facility.phone && (
                      <a className="facility-phone" href={phoneHref(facility.phone)}>
                        {t('common.call', { phone: facility.phone })}
                      </a>
                    )}
                    {facility.latitude != null && facility.longitude != null && (
                      <a
                        className="facility-map"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('nearby.mapsLink')}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="safety-note">{t('nearby.safety')}</p>
    </section>
  )
}
