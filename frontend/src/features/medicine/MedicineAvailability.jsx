import { useEffect, useRef, useState } from 'react'
import { searchMedicineAvailability } from '../../api/medicines.js'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function phoneHref(phone) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export default function MedicineAvailability({ onBack }) {
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
      setError(
        err.message ||
          'We could not load medicine availability. Check your connection and try again.',
      )
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
          &larr; Back to home
        </button>
        <h1 id="medicine-title">Medicine Availability</h1>
        <p className="triage-lead">
          Check which nearby pharmacies and health centres currently have a medicine in stock.
          Availability is informational only. SevaCare does not prescribe medicines or give dosages.
        </p>
      </div>

      <form className="facilities-filters" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="medicine-name">Medicine name</label>
          <input
            id="medicine-name"
            name="medicine"
            type="search"
            placeholder="e.g. Paracetamol"
            value={medicine}
            onChange={(event) => setMedicine(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="medicine-city">Village, town or city</label>
          <input
            id="medicine-city"
            name="city"
            type="search"
            placeholder="e.g. Rampur"
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
          <label htmlFor="medicine-in-stock">Show only in-stock medicines</label>
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
            Loading medicine availability…
          </p>
        )}

        {status === 'error' && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {status === 'idle' && medicines.length === 0 && (
          <div className="result-placeholder">
            <h2>No medicine availability found</h2>
            <p>Try another medicine name or place, or clear the filters.</p>
          </div>
        )}

        {status === 'idle' && medicines.length > 0 && (
          <>
            <p className="facilities-count">
              Showing {medicines.length} {medicines.length === 1 ? 'result' : 'results'}
            </p>
            <ul className="facility-list">
              {medicines.map((item) => (
                <li key={item.id} className="facility-card">
                  <div className="facility-head">
                    <h2>{item.medicine_name}</h2>
                    <span className={`stock-badge ${item.in_stock ? 'is-in' : 'is-out'}`}>
                      {item.in_stock ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>

                  {item.category && <p className="medicine-category">{item.category}</p>}

                  <div className="facility-meta">
                    {item.quantity !== null && item.unit && (
                      <span className="medicine-quantity">
                        {item.quantity} {item.unit} available
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
                      <span className="facility-distance">{item.distance_km} km away</span>
                    )}
                    <span className={`facility-type type-${item.facility_type.toLowerCase()}`}>
                      {item.facility_type}
                    </span>
                  </div>

                  {item.phone && (
                    <a className="facility-phone" href={phoneHref(item.phone)}>
                      Call {item.phone}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <p className="safety-note">
        Availability and prices are demo data for development. Ask a doctor or pharmacist before
        taking any medicine. In an emergency, call your local emergency number.
      </p>
    </section>
  )
}
