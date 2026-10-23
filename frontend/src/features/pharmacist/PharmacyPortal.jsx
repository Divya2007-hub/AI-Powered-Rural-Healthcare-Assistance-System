import { useEffect, useState } from 'react'
import {
  createPharmacyStock,
  deletePharmacyStock,
  listPharmacyStock,
  updatePharmacyStock,
} from '../../api/pharmacist.js'

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function StockRow({ item, onSaved, onDeleted, onError }) {
  const [inStock, setInStock] = useState(item.in_stock)
  const [quantity, setQuantity] = useState(item.quantity ?? '')
  const [unit, setUnit] = useState(item.unit ?? '')
  const [price, setPrice] = useState(item.price ?? '')
  const [saving, setSaving] = useState(false)

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const updated = await updatePharmacyStock(item.id, {
        in_stock: inStock,
        quantity: toNumberOrNull(quantity),
        unit: unit.trim() || null,
        price: toNumberOrNull(price),
      })
      onSaved(updated)
    } catch (err) {
      onError(err.message || 'We could not update this medicine.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Remove ${item.medicine_name} from your stock?`)) return
    try {
      await deletePharmacyStock(item.id)
      onDeleted(item.id)
    } catch (err) {
      onError(err.message || 'We could not remove this medicine.')
    }
  }

  return (
    <li className="stock-row">
      <form onSubmit={save}>
        <div className="stock-row-head">
          <div>
            <h3>{item.medicine_name}</h3>
            {item.category && <p className="medicine-category">{item.category}</p>}
          </div>
          <label className="stock-toggle">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) => setInStock(event.target.checked)}
            />
            <span className={`stock-badge ${inStock ? 'is-in' : 'is-out'}`}>
              {inStock ? 'In stock' : 'Out of stock'}
            </span>
          </label>
        </div>

        <div className="stock-fields">
          <div className="field">
            <label htmlFor={`stock-quantity-${item.id}`}>Quantity</label>
            <input
              id={`stock-quantity-${item.id}`}
              type="number"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor={`stock-unit-${item.id}`}>Unit</label>
            <input
              id={`stock-unit-${item.id}`}
              type="text"
              placeholder="strips"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor={`stock-price-${item.id}`}>Price (₹)</label>
            <input
              id={`stock-price-${item.id}`}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>
        </div>

        <div className="stock-row-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn btn-outline" onClick={remove}>
            Remove
          </button>
        </div>
      </form>
    </li>
  )
}

export default function PharmacyPortal({ onBack }) {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [inStock, setInStock] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listPharmacyStock({ signal: controller.signal })
      .then((result) => {
        if (!active) return
        setData(result)
        setStatus('idle')
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setError(err.message || 'We could not load your stock.')
        setStatus('error')
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const addMedicine = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!name.trim()) {
      setError('Medicine name is required.')
      return
    }

    setAdding(true)
    try {
      const created = await createPharmacyStock({
        medicine_name: name.trim(),
        category: category.trim() || null,
        in_stock: inStock,
        quantity: toNumberOrNull(quantity),
        unit: unit.trim() || null,
        price: toNumberOrNull(price),
      })
      setData((current) => ({
        ...current,
        medicines: [...current.medicines, created],
        count: current.count + 1,
      }))
      setName('')
      setCategory('')
      setUnit('')
      setQuantity('')
      setPrice('')
      setInStock(true)
      setMessage(`${created.medicine_name} added.`)
    } catch (err) {
      setError(err.message || 'We could not add this medicine.')
    } finally {
      setAdding(false)
    }
  }

  const handleSaved = (updated) => {
    setData((current) => ({
      ...current,
      medicines: current.medicines.map((item) => (item.id === updated.id ? updated : item)),
    }))
    setError('')
    setMessage('Stock updated.')
  }

  const handleDeleted = (stockId) => {
    setData((current) => ({
      ...current,
      medicines: current.medicines.filter((item) => item.id !== stockId),
      count: current.count - 1,
    }))
    setError('')
    setMessage('Medicine removed.')
  }

  return (
    <section className="pharmacy" aria-labelledby="pharmacy-title">
      <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
        &larr; Back to home
      </button>

      <h1 id="pharmacy-title">Pharmacy Portal</h1>
      <p className="triage-lead">
        {data
          ? `Update the medicine stock for ${data.facility_name}. Changes are visible to patients immediately.`
          : 'Update the medicine stock for your pharmacy.'}
      </p>

      {status === 'loading' && <p className="facilities-status">Loading your stock…</p>}

      {status === 'error' && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {status === 'idle' && error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {data && (
        <>
          <form className="add-medicine" onSubmit={addMedicine} noValidate>
            <h2>Add a medicine</h2>
            <div className="add-medicine-grid">
              <div className="field">
                <label htmlFor="new-medicine-name">Medicine name</label>
                <input
                  id="new-medicine-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Cetirizine 10mg"
                />
              </div>

              <div className="field">
                <label htmlFor="new-medicine-category">Category</label>
                <input
                  id="new-medicine-category"
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="e.g. Allergy"
                />
              </div>

              <div className="field">
                <label htmlFor="new-medicine-quantity">Quantity</label>
                <input
                  id="new-medicine-quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="new-medicine-unit">Unit</label>
                <input
                  id="new-medicine-unit"
                  type="text"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="strips"
                />
              </div>

              <div className="field">
                <label htmlFor="new-medicine-price">Price (₹)</label>
                <input
                  id="new-medicine-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </div>

              <div className="field field-checkbox">
                <input
                  id="new-medicine-in-stock"
                  type="checkbox"
                  checked={inStock}
                  onChange={(event) => setInStock(event.target.checked)}
                />
                <label htmlFor="new-medicine-in-stock">In stock</label>
              </div>
            </div>

            {message && (
              <p className="form-success" role="status">
                {message}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? 'Adding…' : 'Add medicine'}
            </button>
          </form>

          <div className="stock-section" aria-live="polite">
            <h2>Current stock ({data.count})</h2>

            {data.medicines.length === 0 ? (
              <div className="result-placeholder">
                <h2>No medicines yet</h2>
                <p>Add your first medicine using the form above.</p>
              </div>
            ) : (
              <ul className="stock-list">
                {data.medicines.map((item) => (
                  <StockRow
                    key={item.id}
                    item={item}
                    onSaved={handleSaved}
                    onDeleted={handleDeleted}
                    onError={setError}
                  />
                ))}
              </ul>
            )}

          </div>
        </>
      )}

      <p className="safety-note">
        Update stock honestly. SevaCare does not prescribe medicines; patients should always
        consult a doctor or pharmacist.
      </p>
    </section>
  )
}
