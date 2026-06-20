// Auth state = presence of the Clockwork API token (issued by POST /__clockwork/auth).
// The token itself is managed in api/clockwork.js; this module tracks the
// "is the user allowed into the app" flag so the RequireAuth guard works without
// every component importing the api layer.

import { getToken, setToken, clearToken } from '../api/clockwork.js'

const AUTH_KEY = 'clockwork:auth'

export function isAuthenticated() {
  try {
    return getToken() !== null || sessionStorage.getItem(AUTH_KEY) === '1' || localStorage.getItem(AUTH_KEY) === '1'
  } catch (_) {
    return false
  }
}

// Called by the login page AFTER the backend has accepted the password and returned a token.
export function setAuth(token, remember) {
  setToken(token, remember)
  try {
    sessionStorage.setItem(AUTH_KEY, '1')
    if (remember) localStorage.setItem(AUTH_KEY, '1')
  } catch (_) { /* ignore */ }
}

export function logout() {
  clearToken()
  try {
    sessionStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(AUTH_KEY)
  } catch (_) { /* ignore */ }
}
