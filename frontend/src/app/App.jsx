import { useEffect, useRef, useState } from 'react'
import { fetchMe, logout as apiLogout } from '../api/auth.js'
import { clearToken, getToken } from '../api/token.js'
import AuthScreen from '../features/auth/AuthScreen.jsx'
import NearbyHealthcare from '../features/facilities/NearbyHealthcare.jsx'
import MedicineAvailability from '../features/medicine/MedicineAvailability.jsx'
import Profile from '../features/profile/Profile.jsx'
import SymptomCheck from '../features/triage/SymptomCheck.jsx'
import { LANGUAGES } from '../i18n/languages.js'

/*
 * SevaCare home page.
 *
 * Hero photo: place a licensed image at  frontend/public/images/sevacare-hero.jpg
 * (recommended ~1200x1000, subject on the right). If the file is missing the
 * page automatically shows the built-in illustration instead of a broken image.
 */
const HERO_IMAGE_SRC = '/images/sevacare-hero.jpg'

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'symptoms', label: 'Check Symptoms' },
  { id: 'nearby', label: 'Nearby Healthcare' },
  { id: 'medicine', label: 'Medicine' },
  { id: 'login', label: 'Login' },
]

const FEATURES = [
  { id: 'symptoms', title: 'Symptom Check', note: '', Icon: SymptomIcon },
  { id: 'nearby', title: 'Nearby Healthcare', note: '', Icon: LocationIcon },
  { id: 'medicine', title: 'Medicine Availability', note: '', Icon: MedicineIcon },
  { id: 'sms', title: 'SMS Support', note: '(Low Connectivity)', Icon: SmsIcon },
]

function App() {
  const [language, setLanguage] = useState('en')
  const [view, setView] = useState('home')
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [heroFailed, setHeroFailed] = useState(false)
  const languageRef = useRef(null)

  // Hide the placeholder notice after a few seconds.
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(() => setMessage(''), 4500)
    return () => clearTimeout(timer)
  }, [message])

  // Restore a saved session on first load.
  useEffect(() => {
    if (!getToken()) return undefined
    let active = true

    fetchMe()
      .then((profile) => {
        if (!active) return
        setUser(profile)
        if (profile.language) setLanguage(profile.language)
      })
      .catch(() => {
        if (active) clearToken()
      })

    return () => {
      active = false
    }
  }, [])

  const comingSoon = (label) => setMessage(`${label} is coming soon. This page is not built yet.`)

  const openSymptoms = () => {
    setMessage('')
    setView('symptoms')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openNearby = () => {
    setMessage('')
    setView('nearby')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openMedicine = () => {
    setMessage('')
    setView('medicine')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openAuth = () => {
    setMessage('')
    setView('auth')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openProfile = () => {
    setMessage('')
    setView('profile')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goHome = () => {
    setMessage('')
    setView('home')
  }

  const handleAuthenticated = (authenticatedUser) => {
    setUser(authenticatedUser)
    if (authenticatedUser.language) setLanguage(authenticatedUser.language)
    setView('profile')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUserUpdated = (updatedUser) => {
    setUser(updatedUser)
    if (updatedUser.language) setLanguage(updatedUser.language)
  }

  const handleLogout = async () => {
    try {
      await apiLogout()
    } catch {
      // Clearing the local session below is enough if the request fails.
    }
    setUser(null)
    setView('home')
  }

  const chooseLanguage = (code) => {
    setLanguage(code)
    if (code !== 'en') {
      const chosen = LANGUAGES.find((l) => l.code === code)
      setMessage(`${chosen.name} selected. Translated pages are coming soon; the app is shown in English for now.`)
    }
  }

  const getStarted = () => {
    languageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    languageRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="page">
      <a className="skip-link" href="#main">Skip to main content</a>

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="SevaCare home">
            <LogoMark />
            <span className="brand-text">
              <span className="brand-name">SevaCare</span>
              <span className="brand-tagline">Health for Every Home</span>
            </span>
          </a>

          <nav className="main-nav" aria-label="Main navigation">
            <ul>
              {NAV_ITEMS.map((item) => {
                const isLoginItem = item.id === 'login'
                const isActive =
                  (item.id === 'home' && view === 'home') ||
                  (item.id === 'symptoms' && view === 'symptoms') ||
                  (item.id === 'nearby' && view === 'nearby') ||
                  (item.id === 'medicine' && view === 'medicine') ||
                  (isLoginItem && (view === 'auth' || view === 'profile'))

                const onClick =
                  item.id === 'home'
                    ? goHome
                    : item.id === 'symptoms'
                      ? openSymptoms
                      : item.id === 'nearby'
                        ? openNearby
                        : item.id === 'medicine'
                          ? openMedicine
                          : isLoginItem
                            ? user
                              ? openProfile
                              : openAuth
                            : () => comingSoon(item.label)

                const label = isLoginItem && user ? 'Profile' : item.label

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`nav-link${isActive ? ' is-active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={onClick}
                    >
                      {label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="lang-select-wrap">
            <label className="visually-hidden" htmlFor="header-language">Language</label>
            <select
              id="header-language"
              className="lang-select"
              value={language}
              onChange={(e) => chooseLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main id="main">
        {view === 'symptoms' ? (
          <SymptomCheck language={language} isAuthenticated={Boolean(user)} onBack={goHome} />
        ) : view === 'nearby' ? (
          <NearbyHealthcare onBack={goHome} />
        ) : view === 'medicine' ? (
          <MedicineAvailability onBack={goHome} />
        ) : view === 'auth' ? (
          <AuthScreen onAuthenticated={handleAuthenticated} onBack={goHome} />
        ) : view === 'profile' && user ? (
          <Profile
            user={user}
            onUserUpdated={handleUserUpdated}
            onLogout={handleLogout}
            onBack={goHome}
          />
        ) : (
          <>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              Your Health
              <br />
              Our Priority
            </h1>
            <p className="hero-lead">
              Get quick health guidance, find nearby hospitals, clinics, doctors and pharmacies — even in remote areas.
            </p>

            <ul className="features" aria-label="What you can do">
              {FEATURES.map(({ id, title, note, Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    className="feature"
                    onClick={() => {
                      if (id === 'symptoms') openSymptoms()
                      else if (id === 'nearby') openNearby()
                      else if (id === 'medicine') openMedicine()
                      else comingSoon(title)
                    }}
                  >
                    <span className="feature-icon" aria-hidden="true"><Icon /></span>
                    <span className="feature-title">{title}</span>
                    {note && <span className="feature-note">{note}</span>}
                  </button>
                </li>
              ))}
            </ul>

            <div className="hero-actions">
              <button type="button" className="btn btn-primary" onClick={getStarted}>
                Get Started
              </button>
              <button type="button" className="btn btn-outline" onClick={() => comingSoon('The video')}>
                <PlayIcon />
                Watch Video
              </button>
            </div>

            <p className="safety-note">
              SevaCare gives general health information only. It does not diagnose illness or prescribe medicine.
              In an emergency, contact a doctor or your local emergency number.
            </p>
          </div>

          <div className="hero-visual">
            {!heroFailed ? (
              <img
                className="hero-photo"
                src={HERO_IMAGE_SRC}
                alt="A woman in a village smiling as she uses a health guidance app on her phone"
                onError={() => setHeroFailed(true)}
              />
            ) : (
              <HeroIllustration />
            )}
            <p className="hero-quote">
              Better
              <br />
              Healthcare
              <br />
              for a Healthier
              <br />
              Tomorrow
            </p>
          </div>
        </section>

        <section className="language-card" aria-labelledby="language-title">
          <h2 id="language-title">Choose Your Language</h2>
          <div
            className="language-options"
            role="group"
            aria-labelledby="language-title"
            tabIndex={-1}
            ref={languageRef}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                className={`lang-chip${language === l.code ? ' is-selected' : ''}`}
                aria-pressed={language === l.code}
                lang={l.code}
                aria-label={l.name}
                onClick={() => chooseLanguage(l.code)}
              >
                {l.native}
              </button>
            ))}
          </div>
        </section>
          </>
        )}
      </main>

      <div className="toast-region" role="status" aria-live="polite">
        {message && <p className="toast">{message}</p>}
      </div>
    </div>
  )
}

/* ---------- Inline icons (decorative; labelled by adjacent text) ---------- */

function LogoMark() {
  return (
    <svg className="logo" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path d="M24 44C12 38 6 28 8 14c8 0 14 3 16 10 2-7 8-10 16-10 2 14-4 24-16 30z" fill="#1f8a63" />
      <path d="M24 44V24" stroke="#0b4a38" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="21" y="3" width="6" height="16" rx="2" fill="#0b4a38" />
      <rect x="16" y="8" width="16" height="6" rx="2" fill="#0b4a38" />
    </svg>
  )
}

function SymptomIcon() {
  return (
    <svg viewBox="0 0 32 32" focusable="false">
      <path d="M16 3l10 4v8c0 7-4.5 11.5-10 14C10.500 26.500 6 22 6 15V7z" fill="none" stroke="#136f54" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 20.500s-5-3-5-6.300a2.800 2.800 0 0 1 5-1.700 2.800 2.800 0 0 1 5 1.700c0 3.300-5 6.300-5 6.300z" fill="#136f54" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 32 32" focusable="false">
      <path d="M16 29s-9-8.500-9-16a9 9 0 0 1 18 0c0 7.500-9 16-9 16z" fill="none" stroke="#1565c0" strokeWidth="2" strokeLinejoin="round" />
      <path d="M14.500 9.500h3v3.500H21v3h-3.500V19.500h-3V16H11v-3h3.500z" fill="#1565c0" />
    </svg>
  )
}

function MedicineIcon() {
  return (
    <svg viewBox="0 0 32 32" focusable="false">
      <rect x="9" y="3" width="14" height="5" rx="1.500" fill="none" stroke="#136f54" strokeWidth="2" />
      <path d="M10 8h12v18a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="none" stroke="#136f54" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 13v8M12 17h8" stroke="#136f54" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function SmsIcon() {
  return (
    <svg viewBox="0 0 32 32" focusable="false">
      <path d="M5 7a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H14l-6 5v-5H7a2 2 0 0 1-2-2z" fill="none" stroke="#1565c0" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="11" cy="13" r="1.400" fill="#1565c0" />
      <circle cx="16" cy="13" r="1.400" fill="#1565c0" />
      <circle cx="21" cy="13" r="1.400" fill="#1565c0" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg className="play-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 8l6 4-6 4z" fill="currentColor" />
    </svg>
  )
}

/* Built-in fallback visual shown until a real hero photo is added. */
function HeroIllustration() {
  return (
    <svg
      className="hero-photo hero-illustration"
      viewBox="0 0 600 520"
      role="img"
      aria-label="Illustration of a village with fields and a house under a bright sky, and a phone showing a health cross"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dff1f3" />
          <stop offset="1" stopColor="#f4faf3" />
        </linearGradient>
      </defs>
      <rect width="600" height="520" fill="url(#sky)" />
      <circle cx="480" cy="140" r="40" fill="#fff4c2" />
      <path d="M0 300c80-50 150-60 230-30s150 20 370-40v290H0z" fill="#b9dcae" />
      <path d="M0 360c120-40 220-30 320 0s190 10 280-20v180H0z" fill="#8cc58f" />
      <path d="M0 430c140-30 260-20 380 10s150 0 220-10v90H0z" fill="#5fa874" />
      {/* house */}
      <g transform="translate(400 250)">
        <rect x="0" y="40" width="110" height="70" fill="#e9d4ae" />
        <path d="M-12 44L55 -6l67 50z" fill="#b5835a" />
        <rect x="42" y="68" width="26" height="42" fill="#8a5a3c" />
        <rect x="12" y="62" width="20" height="20" fill="#cfe8f0" />
      </g>
      {/* trees */}
      <g fill="#3f8f5b">
        <circle cx="80" cy="300" r="34" />
        <circle cx="120" cy="320" r="26" />
      </g>
      <rect x="76" y="320" width="8" height="40" fill="#7a5638" />
      {/* phone */}
      <g transform="translate(205 200) rotate(-8 95 150)">
        <rect width="190" height="300" rx="26" fill="#1f3a40" />
        <rect x="10" y="12" width="170" height="276" rx="18" fill="#f4fbf7" />
        <rect x="68" y="60" width="54" height="54" rx="14" fill="#136f54" />
        <path d="M89 72h12v10h10v12h-10v10H89V94H79V82h10z" fill="#ffffff" />
        <rect x="40" y="136" width="110" height="10" rx="5" fill="#b9dcae" />
        <rect x="55" y="156" width="80" height="10" rx="5" fill="#d7ece0" />
        <rect x="42" y="200" width="106" height="36" rx="18" fill="#136f54" />
        <rect x="64" y="214" width="62" height="8" rx="4" fill="#ffffff" />
      </g>
    </svg>
  )
}

export default App