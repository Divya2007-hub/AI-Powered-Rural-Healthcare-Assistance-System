import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGUAGES } from './languages.js'
import { translations } from './translations/index.js'

const STORAGE_KEY = 'sevacare_language'
const FALLBACK_LANGUAGE = 'en'

const I18nContext = createContext(null)

function interpolate(template, vars) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

export function translate(language, key, vars) {
  const dictionary = translations[language] || translations[FALLBACK_LANGUAGE]
  const template = dictionary[key] ?? translations[FALLBACK_LANGUAGE][key] ?? key
  return interpolate(template, vars)
}

function readStoredLanguage() {
  if (typeof window === 'undefined') return FALLBACK_LANGUAGE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored && translations[stored] ? stored : FALLBACK_LANGUAGE
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage)

  const setLanguage = useCallback((code) => {
    if (!translations[code]) return
    setLanguageState(code)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, code)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: LANGUAGES,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language, setLanguage],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return context
}
