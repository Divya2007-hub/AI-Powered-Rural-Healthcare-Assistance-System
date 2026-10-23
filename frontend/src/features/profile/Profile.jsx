import { useEffect, useMemo, useState } from 'react'
import { updateProfile } from '../../api/auth.js'
import { deleteTriageHistory, listTriageHistory } from '../../api/history.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'
import { localeFor } from '../../i18n/languages.js'

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
  const { language: uiLanguage, languages, t } = useI18n()
  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat(localeFor(uiLanguage), { dateStyle: 'medium', timeStyle: 'short' }),
    [uiLanguage],
  )
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
        setHistoryError(err.message || t('profile.errorLoad'))
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
      setMessage(t('profile.updated'))
    } catch (err) {
      setSaveError(err.message || t('profile.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  const removeEntry = async (historyId) => {
    if (!window.confirm(t('profile.confirmRemove'))) return

    try {
      await deleteTriageHistory(historyId)
      setHistory((current) => current.filter((entry) => entry.id !== historyId))
    } catch (err) {
      setHistoryError(err.message || t('profile.errorRemove'))
    }
  }

  return (
    <section className="profile" aria-labelledby="profile-title">
      <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
        {t('common.backHome')}
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
              <label htmlFor="profile-name">{t('profile.name')}</label>
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
              <label htmlFor="profile-language">{t('profile.language')}</label>
              <select
                id="profile-language"
                name="language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {languages.map((option) => (
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
              {saving ? t('common.saving') : t('profile.save')}
            </button>
            <button type="button" className="btn btn-outline" onClick={onLogout}>
              {t('profile.logout')}
            </button>
          </div>
        </form>
      </div>

      <div className="history-section" aria-live="polite">
        <h2>{t('profile.historyTitle')}</h2>

        {historyStatus === 'loading' && (
          <p className="facilities-status">{t('profile.historyLoading')}</p>
        )}

        {historyStatus === 'error' && (
          <p className="form-error" role="alert">
            {historyError}
          </p>
        )}

        {historyStatus === 'idle' && history.length === 0 && (
          <div className="result-placeholder">
            <h2>{t('profile.historyEmptyTitle')}</h2>
            <p>{t('profile.historyEmptyBody')}</p>
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
                    {t('common.remove')}
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
