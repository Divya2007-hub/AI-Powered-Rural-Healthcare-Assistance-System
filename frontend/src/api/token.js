const TOKEN_KEY = 'sevacare_token'

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage may be unavailable in private mode; the session stays in memory.
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore storage errors on logout.
  }
}
