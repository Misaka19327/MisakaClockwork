import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { EN } from '../i18n/en.js'

const THEME_KEY = 'clockwork:theme'
const LANG_KEY = 'clockwork:lang'
const ZOOM_KEY = 'clockwork:zoom'

// Global UI zoom bounds (proportional whole-interface scaling via CSS `zoom`).
// Floor is 100%: with the app's viewport-filling layout (height:100vh shells),
// zoom < 1 makes 100vh resolve larger than the viewport and overflows. Verified
// in-browser — 100–150% fills the viewport cleanly with no overflow.
const ZOOM_MIN = 1
const ZOOM_MAX = 1.5
function clampZoom(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n)) : 1
}

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
  const [zoom, setZoomState] = useState(() => clampZoom(readStored(ZOOM_KEY, '1')))

  // Reflect state onto <html> attributes / CSS vars (drives all oklch dark-mode CSS + global zoom).
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  useEffect(() => { document.documentElement.setAttribute('data-lang', lang) }, [lang])
  useEffect(() => { document.documentElement.style.setProperty('--app-zoom', String(zoom)) }, [zoom])

  const setTheme = useCallback((value) => { setThemeState(value); writeStored(THEME_KEY, value) }, [])
  const setLang = useCallback((value) => { setLangState(value); writeStored(LANG_KEY, value) }, [])
  const setZoom = useCallback((value) => {
    const clamped = clampZoom(value)
    setZoomState(clamped)
    writeStored(ZOOM_KEY, String(clamped))
  }, [])

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
    () => ({ theme, lang, zoom, setTheme, setLang, setZoom, toggleTheme, toggleLang, t }),
    [theme, lang, zoom, setTheme, setLang, setZoom, toggleTheme, toggleLang, t]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
