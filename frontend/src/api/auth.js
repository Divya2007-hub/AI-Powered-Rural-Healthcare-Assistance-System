import { apiFetch } from './client.js'
import { clearToken, setToken } from './token.js'

function jsonOptions(method, payload) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
}

export async function register(payload) {
  const data = await apiFetch('/auth/register', jsonOptions('POST', payload))
  setToken(data.token)
  return data
}

export async function login(payload) {
  const data = await apiFetch('/auth/login', jsonOptions('POST', payload))
  setToken(data.token)
  return data
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } finally {
    clearToken()
  }
}

export function fetchMe() {
  return apiFetch('/auth/me', { method: 'GET' })
}

export function updateProfile(payload) {
  return apiFetch('/users/me', jsonOptions('PATCH', payload))
}
