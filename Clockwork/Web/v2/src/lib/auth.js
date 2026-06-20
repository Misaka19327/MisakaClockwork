// Auth helpers.
//
// Prototype behaviour (and its bug): login.html only wrote `clockwork:remember=1` when the
// "remember" checkbox was ticked, and every other page's guard required exactly that key.
// Logging in WITHOUT ticking "remember" left you unauthenticated on the next page load.
//
// Fix: a session-level auth flag is always set on success; the "remember" checkbox only
// controls whether the flag also persists to localStorage (survives a browser restart).

const AUTH_KEY = 'clockwork:auth'

export function isAuthenticated() {
  try {
    return localStorage.getItem(AUTH_KEY) === '1' || sessionStorage.getItem(AUTH_KEY) === '1'
  } catch (_) {
    return false
  }
}

export function login(remember) {
  try {
    sessionStorage.setItem(AUTH_KEY, '1')
    if (remember) localStorage.setItem(AUTH_KEY, '1')
  } catch (_) { /* ignore */ }
}

export function logout() {
  try {
    sessionStorage.removeItem(AUTH_KEY)
    localStorage.removeItem(AUTH_KEY)
  } catch (_) { /* ignore */ }
}

// Demo key — matches the prototype. In production this would be server-validated.
export const VALID_KEY = 'clockwork-admin-2024'
