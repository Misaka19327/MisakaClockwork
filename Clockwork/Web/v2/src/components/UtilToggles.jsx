import { useApp } from '../context/AppContext.jsx'

// Theme (light/dark) + language (zh/en) toggle cluster.
export default function UtilToggles() {
  const { theme, lang, setTheme, setLang } = useApp()
  return (
    <div className="util-toggles">
      <button className={`toggle-btn ${theme === 'light' ? 'active' : ''}`} data-theme-toggle="light" onClick={() => setTheme('light')} aria-label="浅色模式">☀</button>
      <button className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`} data-theme-toggle="dark" onClick={() => setTheme('dark')} aria-label="深色模式">☾</button>
      <span className="util-sep" />
      <button className={`toggle-btn ${lang === 'zh' ? 'active' : ''}`} data-lang-toggle="zh" onClick={() => setLang('zh')} aria-label="中文">中</button>
      <button className={`toggle-btn ${lang === 'en' ? 'active' : ''}`} data-lang-toggle="en" onClick={() => setLang('en')} aria-label="English">EN</button>
    </div>
  )
}
