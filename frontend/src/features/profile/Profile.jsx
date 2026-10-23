import { useEffect, useState } from 'react'
import { updateProfile } from '../../api/auth.js'
import { deleteTriageHistory, listTriageHistory } from '../../api/history.js'
import { LANGUAGES } from '../../i18n/languages.js'

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

const URGENCY_CLASS = {
  low: 'is-low',
  consult: 'is-consult',
  urgent: 'is-urgent',
}

function parseDate(value) {
  if (!value) return null
  const hasZone = value.endsWith('Z') || value.includes('+')
  return new Date(hasZone ? value : `${value}Z`)
}

function initialsOf(name) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((part) => part[0]).join('').toUpperCase() || 'U'
}

export default function Profile({ user, onUserUpdated, onLogout, onBack }) {
  const [name, setName] = useState(user.name)
  const [language, setLanguage] = useState(user.language || 'en')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [history, setHistory] = useState([])
  const [historyStatus, setHistoryStatus] = useState('loading')
  const [historyError, setHistoryError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listTriageHistory(50, { signal: controller.signal })
      .then((data) => {
        if (!active) return
        setHistory(data.history)
        setHistoryStatus('idle')
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setHistoryError(err.message || 'We could not load your history.')
        setHistoryStatus('error')
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setSaveError('')

    try {
      const updated = await updateProfile({ name, language })
      onUserUpdated(updated)
      setMessage('Profile updated.')
    } catch (err) {
      setSaveError(err.message || 'We could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  const removeEntry = async (historyId) => {
    if (!window.confirm('Remove this entry from your history?')) return

    try {
      await deleteTriageHistory(historyId)
      setHistory((current) => current.filter((entry) => entry.id !== historyId))
    } catch (err) {
      setHistoryError(err.message || 'We could not remove that entry.')
    }
  }

  return (
    <section className="profile" aria-labelledby="profile-title">
      <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
        &larr; Back to home
      </button>

      <div className="profile-card">
        <div className="profile-head">
          <span className="profile-avatar" aria-hidden="true">{initialsOf(user.name)}</span>
          <div>
            <h1 id="profile-title">{user.name}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <form className="profile-form" onSubmit={saveProfile} noValidate>
          <div className="field-row">
            <div className="field">
              <label htmlFor="profile-name">Full name</label>
              <input
                id="profile-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="profile-language">Preferred language</label>
              <select
                id="profile-language"
                name="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {LANGUAGES.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {message && (
            <p className="form-success" role="status">
              {message}
            </p>
          )}
          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}

          <div className="profile-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" className="btn btn-outline" onClick={onLogout}>
              Log out
            </button>
          </div>
        </form>
      </div>

      <div className="history-section" aria-live="polite">
        <h2>Your symptom history</h2>

        {historyStatus === 'loading' && <p className="facilities-status">Loading history…</p>}

        {historyStatus === 'error' && (
          <p className="form-error" role="alert">
            {historyError}
          </p>
        )}

        {historyStatus === 'idle' && history.length === 0 && (
          <div className="result-placeholder">
            <h2>No history yet</h2>
            <p>When you check symptoms while logged in, the results appear here.</p>
          </div>
        )}

        {history.length > 0 && (
          <ul className="history-list">
            {history.map((entry) => {
              const date = parseDate(entry.created_at)
              return (
                <li key={entry.id} className="history-item">
                  <div className="history-head">
                    <span className={`urgency-pill ${URGENCY_CLASS[entry.urgency_code] || 'is-consult'}`}>
                      {entry.urgency}
                    </span>
                    {date && <time dateTime={entry.created_at}>{dateFormat.format(date)}</time>}
                  </div>

                  <p className="history-symptoms">{entry.symptoms.join(', ')}</p>
                  <p className="history-summary">{entry.summary}</p>

                  <button
                    type="button"
                    className="link-button"
                    onClick={() => removeEntry(entry.id)}
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {historyError && historyStatus !== 'error' && (
          <p className="form-error" role="alert">
            {historyError}
          </p>
        )}
      </div>
    </section>
  )
}
