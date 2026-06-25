import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

// Settings popover: global font-size (proportional zoom) + theme + language.
// Replaces the old 4-button cluster. `placement` controls drop direction
// ('down' for top bars, 'up' for the sidebar footer at the bottom of the screen).
export default function UtilToggles({ placement = 'down' }) {
  const { theme, lang, setTheme, setLang, zoom, setZoom, t } = useApp()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  // Close on outside click / Esc while open.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pct = Math.round(zoom * 100)

  return (
    <div className="util-toggles" ref={wrapRef}>
      <button
        className={`toggle-btn ${open ? 'active' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={t('设置')}
        aria-expanded={open}
        aria-haspopup="dialog"
      >⚙</button>

      {open && (
        <div className="settings-popover" data-placement={placement} role="dialog" aria-label={t('设置')}>
          <div className="settings-row">
            <span className="settings-label">{t('字号')}</span>
            <input
              className="settings-slider"
              type="range" min={100} max={150} step={5} value={pct}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              aria-label={t('字号')}
            />
            <span className="settings-pct">{pct}%</span>
            <button className="settings-reset" onClick={() => setZoom(1)} aria-label={t('重置')} title={t('重置')}>↺</button>
          </div>

          <div className="settings-row">
            <span className="settings-label">{t('主题')}</span>
            <button className={`toggle-btn ${theme === 'light' ? 'active' : ''}`} data-theme-toggle="light" onClick={() => setTheme('light')} aria-label={t('浅色')}>☀ {t('浅色')}</button>
            <button className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`} data-theme-toggle="dark" onClick={() => setTheme('dark')} aria-label={t('深色')}>☾ {t('深色')}</button>
          </div>

          <div className="settings-row">
            <span className="settings-label">{t('语言')}</span>
            <button className={`toggle-btn ${lang === 'zh' ? 'active' : ''}`} data-lang-toggle="zh" onClick={() => setLang('zh')} aria-label="中文">中</button>
            <button className={`toggle-btn ${lang === 'en' ? 'active' : ''}`} data-lang-toggle="en" onClick={() => setLang('en')} aria-label="English">EN</button>
          </div>
        </div>
      )}
    </div>
  )
}
