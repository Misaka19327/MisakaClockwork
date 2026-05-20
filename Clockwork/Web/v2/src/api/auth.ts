const AUTH_TOKEN_KEY = 'clockwork-auth-token'

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token: string | null): void {
  if (token === null) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  } else {
    localStorage.setItem(AUTH_TOKEN_KEY, token)
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}
