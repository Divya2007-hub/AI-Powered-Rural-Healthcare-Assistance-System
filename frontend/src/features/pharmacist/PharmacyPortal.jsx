import { useEffect, useState } from 'react'
import {
  createPharmacyStock,
  deletePharmacyStock,
  listPharmacyStock,
  updatePharmacyStock,
} from '../../api/pharmacist.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

function toNumberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function StockRow({ item, onSaved, onDeleted, onError }) {
  const { t } = useI18n()
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
      onError(err.message || t('pharmacy.updateError'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(t('pharmacy.confirmRemove', { name: item.medicine_name }))) return
    try {
      await deletePharmacyStock(item.id)
      onDeleted(item.id)
    } catch (err) {
      onError(err.message || t('pharmacy.removeError'))
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
              {inStock ? t('common.inStock') : t('common.outOfStock')}
            </span>
          </label>
        </div>

        <div className="stock-fields">
          <div className="field">
            <label htmlFor={`stock-quantity-${item.id}`}>{t('pharmacy.quantity')}</label>
            <input
              id={`stock-quantity-${item.id}`}
              type="number"
              min="0"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor={`stock-unit-${item.id}`}>{t('pharmacy.unit')}</label>
            <input
              id={`stock-unit-${item.id}`}
              type="text"
              placeholder={t('pharmacy.unitPlaceholder')}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor={`stock-price-${item.id}`}>{t('pharmacy.price')}</label>
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
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button type="button" className="btn btn-outline" onClick={remove}>
            {t('common.remove')}
          </button>
        </div>
      </form>
    </li>
  )
}

export default function PharmacyPortal({ onBack }) {
  const { t } = useI18n()
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
        setError(err.message || t('pharmacy.loadError'))
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
      setError(t('pharmacy.requiredName'))
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
      setMessage(t('pharmacy.added', { name: created.medicine_name }))
    } catch (err) {
      setError(err.message || t('pharmacy.addError'))
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
    setMessage(t('pharmacy.updated'))
  }

  const handleDeleted = (stockId) => {
    setData((current) => ({
      ...current,
      medicines: current.medicines.filter((item) => item.id !== stockId),
      count: current.count - 1,
    }))
    setError('')
    setMessage(t('pharmacy.removed'))
  }

  return (
    <section className="pharmacy" aria-labelledby="pharmacy-title">
      <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
        {t('common.backHome')}
      </button>

      <h1 id="pharmacy-title">{t('pharmacy.title')}</h1>
      <p className="triage-lead">
        {data
          ? t('pharmacy.lead', { facility: data.facility_name })
          : t('pharmacy.leadGeneric')}
      </p>

      {status === 'loading' && <p className="facilities-status">{t('pharmacy.loading')}</p>}

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
            <h2>{t('pharmacy.addTitle')}</h2>
            <div className="add-medicine-grid">
              <div className="field">
                <label htmlFor="new-medicine-name">{t('pharmacy.name')}</label>
                <input
                  id="new-medicine-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t('pharmacy.namePlaceholder')}
                />
              </div>

              <div className="field">
                <label htmlFor="new-medicine-category">{t('pharmacy.category')}</label>
                <input
                  id="new-medicine-category"
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder={t('pharmacy.categoryPlaceholder')}
                />
              </div>

              <div className="field">
                <label htmlFor="new-medicine-quantity">{t('pharmacy.quantity')}</label>
                <input
                  id="new-medicine-quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="new-medicine-unit">{t('pharmacy.unit')}</label>
                <input
                  id="new-medicine-unit"
                  type="text"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder={t('pharmacy.unitPlaceholder')}
                />
              </div>

              <div className="field">
                <label htmlFor="new-medicine-price">{t('pharmacy.price')}</label>
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
                <label htmlFor="new-medicine-in-stock">{t('common.inStock')}</label>
              </div>
            </div>

            {message && (
              <p className="form-success" role="status">
                {message}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? t('pharmacy.adding') : t('pharmacy.add')}
            </button>
          </form>

          <div className="stock-section" aria-live="polite">
            <h2>{t('pharmacy.stockTitle', { count: data.count })}</h2>

            {data.medicines.length === 0 ? (
              <div className="result-placeholder">
                <h2>{t('pharmacy.emptyTitle')}</h2>
                <p>{t('pharmacy.emptyBody')}</p>
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

      <p className="safety-note">{t('pharmacy.safety')}</p>
    </section>
  )
}
