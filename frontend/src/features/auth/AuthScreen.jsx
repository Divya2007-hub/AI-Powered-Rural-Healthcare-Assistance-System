import { useState } from 'react'
import { login, register } from '../../api/auth.js'
import { LANGUAGES } from '../../i18n/languages.js'

export default function AuthScreen({ onAuthenticated, onBack }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState('en')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isRegister = mode === 'register'

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const data = isRegister
        ? await register({ name, email, password, language })
        : await login({ email, password })
      onAuthenticated(data.user)
    } catch (err) {
      setError(err.message || 'We could not sign you in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register')
    setError('')
  }

  return (
    <section className="auth" aria-labelledby="auth-title">
      <div className="auth-card">
        <button type="button" className="btn btn-outline btn-back" onClick={onBack}>
          &larr; Back to home
        </button>

        <h1 id="auth-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="triage-lead">
          {isRegister
            ? 'Save your symptom checks and keep your health history in one place.'
            : 'Log in to see your profile and past symptom checks.'}
        </p>

        <form onSubmit={submit} noValidate>
          {isRegister && (
            <div className="field">
              <label htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isRegister ? 8 : 1}
              required
            />
            {isRegister && <p className="field-hint">Use at least 8 characters.</p>}
          </div>

          {isRegister && (
            <div className="field">
              <label htmlFor="auth-language">Preferred language</label>
              <select
                id="auth-language"
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
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New to SevaCare?'}{' '}
          <button type="button" className="link-button" onClick={switchMode}>
            {isRegister ? 'Log in' : 'Create one'}
          </button>
        </p>

        <p className="safety-note">
          Your account keeps your symptom history private to you. SevaCare never sells your data.
        </p>
      </div>
    </section>
  )
}
