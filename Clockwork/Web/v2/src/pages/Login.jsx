import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import UtilToggles from '../components/UtilToggles.jsx'
import Icon from '../components/Icon.jsx'
import { isAuthenticated, setAuth } from '../lib/auth.js'
import { api } from '../api/clockwork.js'
import './login.css'

export default function Login() {
  const { t } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [value, setValue] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  // Auto-redirect if already authenticated; autofocus the input otherwise.
  useEffect(() => {
    if (isAuthenticated()) navigate('/', { replace: true })
    else inputRef.current?.focus()
  }, [navigate])

  function submit(e) {
    e.preventDefault()
    const key = value.trim()
    setError('')
    if (!key) {
      setError(t('请输入访问密钥'))
      inputRef.current?.focus()
      return
    }
    setLoading(true)
    // Real auth: POST /__clockwork/auth with the password -> { token }.
    api.authenticate(key)
      .then(({ token }) => {
        if (!token) {
          const err = new Error(t('密钥不正确，请重试')); err.status = 403; throw err
        }
        setAuth(token, remember)
        navigate(from, { replace: true })
      })
      .catch((e) => {
        setLoading(false)
        const msg = e && e.status === 403 ? t('密钥不正确，请重试') : (e && e.message) || t('密钥不正确，请重试')
        setError(msg)
        inputRef.current?.focus()
        inputRef.current?.select()
      })
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <div className="brand-logo"><Icon name="clock" size={24} strokeWidth={1.8} /></div>
          <h1>{t('Clockwork')}</h1>
          <p>{t('Laravel 调试面板 · 请求追踪与性能分析')}</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="secret-key">{t('访问密钥')}</label>
          <div className={`input-wrap ${error ? 'error' : ''}`}>
            <input
              id="secret-key"
              type="password"
              ref={inputRef}
              value={value}
              onChange={(e) => { setValue(e.target.value); if (error) setError('') }}
              placeholder={t('输入 Clockwork 密钥以继续')}
              autoComplete="off"
              spellCheck={false}
            />
            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className={`error-msg ${error ? 'visible' : ''}`}>
            <Icon name="x" size={14} strokeWidth={2} />
            <span>{error || ' '}</span>
          </div>
        </div>

        <div className="remember-row">
          <input id="remember-me" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <label htmlFor="remember-me">{t('记住登录状态（下次自动跳过）')}</label>
        </div>

        <button className="btn-login" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : <Icon name="lock" size={16} strokeWidth={2} />}
          <span>{loading ? t('验证中…') : t('登 录')}</span>
        </button>

        <div className="login-footer">
          <span>{t('Clockwork v5.x ·')}</span>{' '}
          <a href="https://github.com/itsgoingd/clockwork" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>

        <div className="login-utils"><UtilToggles /></div>
      </form>
    </div>
  )
}
