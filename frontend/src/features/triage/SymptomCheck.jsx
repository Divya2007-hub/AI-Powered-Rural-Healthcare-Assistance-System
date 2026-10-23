import { useEffect, useRef, useState } from 'react'
import { assessSymptoms } from '../../api/triage.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

const URGENCY_META = {
  low: { className: 'is-low', label: 'Low urgency' },
  consult: { className: 'is-consult', label: 'Consultation recommended' },
  urgent: { className: 'is-urgent', label: 'Urgent care required' },
}

function parseSymptoms(text) {
  return text
    .split(/[\n,]+/)
    .map((symptom) => symptom.trim())
    .filter(Boolean)
    .filter((symptom, index, list) => list.indexOf(symptom) === index)
    .slice(0, 20)
}

function parseOptionalNumber(value) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function SymptomCheck({ isAuthenticated = false, onBack }) {
  const { language, t } = useI18n()
  const [symptomsText, setSymptomsText] = useState('')
  const [age, setAge] = useState('')
  const [duration, setDuration] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const resultRef = useRef(null)
  const requestRef = useRef(null)

  useEffect(() => {
    if (result) resultRef.current?.focus()
  }, [result])

  useEffect(() => () => requestRef.current?.abort(), [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const symptoms = parseSymptoms(symptomsText)
    if (symptoms.length === 0) {
      setError(t('symptoms.errorEmpty'))
      return
    }

    const ageYears = parseOptionalNumber(age)
    if (ageYears !== null && (ageYears < 0 || ageYears > 120)) {
      setError(t('symptoms.errorAge'))
      return
    }

    const durationDays = parseOptionalNumber(duration)
    if (durationDays !== null && (durationDays < 0 || durationDays > 365)) {
      setError(t('symptoms.errorDuration'))
      return
    }

    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller

    setStatus('loading')
    setResult(null)

    try {
      const assessment = await assessSymptoms(
        {
          symptoms,
          age_years: ageYears,
          duration_days: durationDays,
          language,
        },
        { signal: controller.signal },
      )
      setResult(assessment)
      setStatus('idle')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || t('symptoms.errorService'))
      setStatus('idle')
    }
  }

  const reset = () => {
    setResult(null)
    setError('')
    setStatus('idle')
  }

  return (
    <section className="triage" aria-labelledby="triage-title">
      <div className="triage-intro">
        <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
          {t('common.backHome')}
        </button>
        <h1 id="triage-title">{t('symptoms.title')}</h1>
        <p className="triage-lead">{t('symptoms.lead')}</p>
      </div>

      <div className="triage-grid">
        <form className="triage-card" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="symptoms">{t('symptoms.label')}</label>
            <p className="field-hint" id="symptoms-hint">
              {t('symptoms.hint')}
            </p>
            <textarea
              id="symptoms"
              name="symptoms"
              rows={5}
              value={symptomsText}
              onChange={(event) => setSymptomsText(event.target.value)}
              placeholder={t('symptoms.placeholder')}
              aria-describedby="symptoms-hint"
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="age">{t('symptoms.age')}</label>
              <input
                id="age"
                name="age"
                type="number"
                inputMode="numeric"
                min="0"
                max="120"
                placeholder={t('common.optional')}
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="duration">{t('symptoms.duration')}</label>
              <input
                id="duration"
                name="duration"
                type="number"
                inputMode="numeric"
                min="0"
                max="365"
                placeholder={t('common.optional')}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="triage-actions">
            <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? t('symptoms.checking') : t('symptoms.submit')}
            </button>
            {result && (
              <button type="button" className="btn btn-outline" onClick={reset}>
                {t('symptoms.startOver')}
              </button>
            )}
          </div>

          <p className="safety-note">{t('symptoms.safety')}</p>

          {isAuthenticated && (
            <p className="history-note">{t('symptoms.savedNote')}</p>
          )}
        </form>

        <div className="triage-result" aria-live="polite">
          {!result && status !== 'loading' && (
            <div className="result-placeholder">
              <h2>{t('symptoms.placeholderTitle')}</h2>
              <p>{t('symptoms.placeholderBody')}</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="result-placeholder" role="status">
              <h2>{t('symptoms.loadingTitle')}</h2>
              <p>{t('symptoms.loadingBody')}</p>
            </div>
          )}

          {result && (
            <article
              ref={resultRef}
              tabIndex={-1}
              className={`result-card ${URGENCY_META[result.urgency_code]?.className || 'is-consult'}`}
            >
              <p className="result-eyebrow">{t('symptoms.urgencyEyebrow')}</p>
              <h2 className="result-urgency">{result.urgency}</h2>
              <p className="result-summary">{result.summary}</p>

              {result.emergency && (
                <p className="result-emergency" role="alert">
                  {t('symptoms.emergencyWarning')}
                </p>
              )}

              {result.red_flags.length > 0 && (
                <div className="result-block">
                  <h3>{t('symptoms.redFlagsTitle')}</h3>
                  <ul>
                    {result.red_flags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="result-block">
                <h3>{t('symptoms.adviceTitle')}</h3>
                <ul>
                  {result.advice.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <p className="result-disclaimer">{result.disclaimer}</p>
              <p className="result-engine">{t('symptoms.source', { engine: result.engine })}</p>
            </article>
          )}
        </div>
      </div>
    </section>
  )
}
