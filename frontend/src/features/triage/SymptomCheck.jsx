import { useEffect, useRef, useState } from 'react'
import { assessSymptoms } from '../../api/triage.js'

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

export default function SymptomCheck({ language, isAuthenticated = false, onBack }) {
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
      setError('Please enter at least one symptom.')
      return
    }

    const ageYears = parseOptionalNumber(age)
    if (ageYears !== null && (ageYears < 0 || ageYears > 120)) {
      setError('Age must be between 0 and 120 years.')
      return
    }

    const durationDays = parseOptionalNumber(duration)
    if (durationDays !== null && (durationDays < 0 || durationDays > 365)) {
      setError('How long you have had the symptoms must be between 0 and 365 days.')
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
      setError(
        err.message ||
          'We could not reach the health service. Check your connection and try again.',
      )
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
          &larr; Back to home
        </button>
        <h1 id="triage-title">Check Your Symptoms</h1>
        <p className="triage-lead">
          Tell us what you are feeling. SevaCare gives first-level urgency guidance and safe next
          steps. It does not diagnose illness or prescribe medicine.
        </p>
      </div>

      <div className="triage-grid">
        <form className="triage-card" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="symptoms">Symptoms</label>
            <p className="field-hint" id="symptoms-hint">
              Enter one symptom per line, for example: fever, then cough on the next line.
            </p>
            <textarea
              id="symptoms"
              name="symptoms"
              rows={5}
              value={symptomsText}
              onChange={(event) => setSymptomsText(event.target.value)}
              placeholder={'fever\ncough\nheadache'}
              aria-describedby="symptoms-hint"
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="age">Age (years)</label>
              <input
                id="age"
                name="age"
                type="number"
                inputMode="numeric"
                min="0"
                max="120"
                placeholder="Optional"
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="duration">How long? (days)</label>
              <input
                id="duration"
                name="duration"
                type="number"
                inputMode="numeric"
                min="0"
                max="365"
                placeholder="Optional"
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
              {status === 'loading' ? 'Checking…' : 'Get Guidance'}
            </button>
            {result && (
              <button type="button" className="btn btn-outline" onClick={reset}>
                Start over
              </button>
            )}
          </div>

          <p className="safety-note">
            In an emergency, contact a doctor or your local emergency number right away.
          </p>

          {isAuthenticated && (
            <p className="history-note">Results are saved to your profile history.</p>
          )}
        </form>

        <div className="triage-result" aria-live="polite">
          {!result && status !== 'loading' && (
            <div className="result-placeholder">
              <h2>Your guidance will appear here</h2>
              <p>
                Share your symptoms to see an urgency level and safe next steps. This is general
                health information, not a diagnosis.
              </p>
            </div>
          )}

          {status === 'loading' && (
            <div className="result-placeholder" role="status">
              <h2>Checking your symptoms…</h2>
              <p>This usually takes a moment.</p>
            </div>
          )}

          {result && (
            <article
              ref={resultRef}
              tabIndex={-1}
              className={`result-card ${URGENCY_META[result.urgency_code]?.className || 'is-consult'}`}
            >
              <p className="result-eyebrow">Urgency</p>
              <h2 className="result-urgency">{result.urgency}</h2>
              <p className="result-summary">{result.summary}</p>

              {result.emergency && (
                <p className="result-emergency" role="alert">
                  Warning signs of an emergency were found. Get medical help now.
                </p>
              )}

              {result.red_flags.length > 0 && (
                <div className="result-block">
                  <h3>Warning signs found</h3>
                  <ul>
                    {result.red_flags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="result-block">
                <h3>What you can do next</h3>
                <ul>
                  {result.advice.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <p className="result-disclaimer">{result.disclaimer}</p>
              <p className="result-engine">Guidance source: {result.engine}</p>
            </article>
          )}
        </div>
      </div>
    </section>
  )
}
