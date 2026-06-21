// Auth state = presence of the Clockwork API token (issued by POST /__clockwork/auth).
// The token is the single source of truth and is managed in api/clockwork.js; this module is a
// thin semantic wrapper the Login page uses to decide whether to auto-bounce an already-
// authenticated user back into the app.
//
// Authentication is reactive, not gated — pages are never blocked on this flag. The request layer
// in api/clockwork.js redirects to /login only when the backend replies 403 with a `requires`
// array, so no login page is shown when no key is configured. On such a 403 the request layer
// calls clearToken(); since the token is the ONLY auth state, that fully signs the user out —
// there is no separate "auth" flag left to bounce them back into a redirect loop.

import { getToken, setToken, clearToken } from '../api/clockwork.js'

export function isAuthenticated() {
  try {
    return getToken() !== null
  } catch (_) {
    return false
  }
}

// Called by the login page AFTER the backend has accepted the password and returned a token.
export function setAuth(token, remember) {
  setToken(token, remember)
}

export function logout() {
  clearToken()
}
