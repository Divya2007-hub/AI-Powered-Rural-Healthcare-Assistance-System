import { useEffect, useMemo, useRef, useState } from 'react'
import { searchMedicineAvailability } from '../../api/medicines.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { localeFor } from '../../i18n/languages.js'

function phoneHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function facilityTypeLabel(type, t) {
  const key = `facilityType.${type}`
  const translated = t(key)
  return translated === key ? type : translated
}

export default function MedicineAvailability({ onBack }) {
  const { language, t } = useI18n()
  const inr = useMemo(
    () => new Intl.NumberFormat(localeFor(language), { style: 'currency', currency: 'INR' }),
    [language],
  )
  const [medicine, setMedicine] = useState('')
  const [city, setCity] = useState('')
  const [inStock, setInStock] = useState(true)
  const [medicines, setMedicines] = useState([])
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
      const data = await searchMedicineAvailability(filters, { signal: controller.signal })
      setMedicines(data.medicines)
      setStatus('idle')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || t('medicine.error'))
      setMedicines([])
      setStatus('error')
    }
  }

  useEffect(() => {
    load({ inStock: true, limit: 100 })
    return () => requestRef.current?.abort()
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    load({ medicine, city, inStock, limit: 100 })
  }

  const clearFilters = () => {
    setMedicine('')
    setCity('')
    setInStock(true)
    load({ inStock: true, limit: 100 })
  }

  return (
    <section className="facilities" aria-labelledby="medicine-title">
      <div className="triage-intro">
        <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
          {t('common.backHome')}
        </button>
        <h1 id="medicine-title">{t('medicine.title')}</h1>
        <p className="triage-lead">{t('medicine.lead')}</p>
      </div>

      <form className="facilities-filters" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="medicine-name">{t('medicine.nameLabel')}</label>
          <input
            id="medicine-name"
            name="medicine"
            type="search"
            placeholder={t('medicine.namePlaceholder')}
            value={medicine}
            onChange={(event) => setMedicine(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="medicine-city">{t('nearby.cityLabel')}</label>
          <input
            id="medicine-city"
            name="city"
            type="search"
            placeholder={t('nearby.cityPlaceholder')}
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </div>

        <div className="field field-checkbox">
          <input
            id="medicine-in-stock"
            name="in_stock"
            type="checkbox"
            checked={inStock}
            onChange={(event) => setInStock(event.target.checked)}
          />
          <label htmlFor="medicine-in-stock">{t('medicine.inStockOnly')}</label>
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
            {t('medicine.loading')}
          </p>
        )}

        {status === 'error' && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {status === 'idle' && medicines.length === 0 && (
          <div className="result-placeholder">
            <h2>{t('medicine.emptyTitle')}</h2>
            <p>{t('medicine.emptyBody')}</p>
          </div>
        )}

        {status === 'idle' && medicines.length > 0 && (
          <>
            <p className="facilities-count">
              {medicines.length === 1
                ? t('medicine.showingOne')
                : t('medicine.showingMany', { count: medicines.length })}
            </p>
            <ul className="facility-list">
              {medicines.map((item) => (
                <li key={item.id} className="facility-card">
                  <div className="facility-head">
                    <h2>{item.medicine_name}</h2>
                    <span className={`stock-badge ${item.in_stock ? 'is-in' : 'is-out'}`}>
                      {item.in_stock ? t('common.inStock') : t('common.outOfStock')}
                    </span>
                  </div>

                  {item.category && <p className="medicine-category">{item.category}</p>}

                  <div className="facility-meta">
                    {item.quantity !== null && item.unit && (
                      <span className="medicine-quantity">
                        {t('medicine.available', { quantity: item.quantity, unit: item.unit })}
                      </span>
                    )}
                    {item.price !== null && (
                      <span className="medicine-price">{inr.format(item.price)}</span>
                    )}
                  </div>

                  <p className="facility-address">
                    {item.facility_name}, {item.city}, {item.state}
                  </p>

                  <div className="facility-meta">
                    {item.distance_km !== null && (
                      <span className="facility-distance">
                        {t('common.kmAway', { distance: item.distance_km })}
                      </span>
                    )}
                    <span className={`facility-type type-${item.facility_type.toLowerCase()}`}>
                      {facilityTypeLabel(item.facility_type, t)}
                    </span>
                  </div>

                  {item.phone && (
                    <a className="facility-phone" href={phoneHref(item.phone)}>
                      {t('common.call', { phone: item.phone })}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="safety-note">{t('medicine.safety')}</p>
    </section>
  )
}
