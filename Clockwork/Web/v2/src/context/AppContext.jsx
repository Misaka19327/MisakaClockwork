import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { EN } from '../i18n/en.js'

const THEME_KEY = 'clockwork:theme'
const LANG_KEY = 'clockwork:lang'

const AppContext = createContext(null)

function readStored(key, fallback) {
  try { return localStorage.getItem(key) || fallback } catch (_) { return fallback }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, value) } catch (_) { /* ignore */ }
}

export function AppProvider({ children }) {
  const [theme, setThemeState] = useState(() => readStored(THEME_KEY, 'light'))
  const [lang, setLangState] = useState(() => readStored(LANG_KEY, 'zh'))

  // Reflect state onto <html> attributes (drives all oklch dark-mode CSS).
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  useEffect(() => { document.documentElement.setAttribute('data-lang', lang) }, [lang])

  const setTheme = useCallback((value) => { setThemeState(value); writeStored(THEME_KEY, value) }, [])
  const setLang = useCallback((value) => { setLangState(value); writeStored(LANG_KEY, value) }, [])

  const toggleTheme = useCallback(() => setThemeState(prev => {
    const next = prev === 'light' ? 'dark' : 'light'
    writeStored(THEME_KEY, next)
    return next
  }), [])

  const toggleLang = useCallback(() => setLangState(prev => {
    const next = prev === 'zh' ? 'en' : 'zh'
    writeStored(LANG_KEY, next)
    return next
  }), [])

  // t(key): identity for zh, dictionary lookup for en, fallback to the key.
  const t = useCallback((key) => {
    if (key == null) return ''
    if (lang === 'zh') return key
    return Object.prototype.hasOwnProperty.call(EN, key) ? EN[key] : key
  }, [lang])

  const value = useMemo(
    () => ({ theme, lang, setTheme, setLang, toggleTheme, toggleLang, t }),
    [theme, lang, setTheme, setLang, toggleTheme, toggleLang, t]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
