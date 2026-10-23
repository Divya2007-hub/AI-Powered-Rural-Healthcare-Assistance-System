import { useState } from 'react'
import { login, register } from '../../api/auth.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

export default function AuthScreen({ onAuthenticated, onBack }) {
  const { language: currentLanguage, languages, t } = useI18n()
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [language, setLanguage] = useState(currentLanguage)
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
      setError(err.message || t('auth.error'))
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
          {t('common.backHome')}
        </button>

        <h1 id="auth-title">{isRegister ? t('auth.createTitle') : t('auth.loginTitle')}</h1>
        <p className="triage-lead">
          {isRegister ? t('auth.createLead') : t('auth.loginLead')}
        </p>

        <form onSubmit={submit} noValidate>
          {isRegister && (
            <div className="field">
              <label htmlFor="auth-name">{t('auth.name')}</label>
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
            <label htmlFor="auth-email">{t('auth.email')}</label>
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
            <label htmlFor="auth-password">{t('auth.password')}</label>
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
            {isRegister && <p className="field-hint">{t('auth.passwordHint')}</p>}
          </div>

          {isRegister && (
            <div className="field">
              <label htmlFor="auth-language">{t('auth.language')}</label>
              <select
                id="auth-language"
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
          )}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting
              ? t('auth.wait')
              : isRegister
                ? t('auth.createAccount')
                : t('auth.login')}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? t('auth.haveAccount') : t('auth.newUser')}{' '}
          <button type="button" className="link-button" onClick={switchMode}>
            {isRegister ? t('auth.login') : t('auth.createOne')}
          </button>
        </p>

        <p className="safety-note">{t('auth.safety')}</p>
      </div>
    </section>
  )
}
