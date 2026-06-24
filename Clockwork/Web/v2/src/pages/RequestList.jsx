import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { gsap, motionOk } from '../lib/motion.js'
import { durBar, durStr, memStr } from '../lib/format.js'
import Sidebar from '../components/Sidebar.jsx'
import Icon from '../components/Icon.jsx'
import { MethodBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx'
import { api, toListRow, toFailureRow } from '../api/clockwork.js'
import './request-list.css'

const TYPE_FILTERS = [
  { key: 'all',       icon: null,       label: '全部' },
  { key: 'request',   icon: 'globe',    label: '请求' },
  { key: 'command',   icon: 'terminal', label: '命令' },
  { key: 'queue-job', icon: 'queue',    label: '队列' },
  { key: 'test',      icon: 'grid',     label: '测试' },
]

export default function RequestList() {
  const { t } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // ?type=failed switches this page to the failures endpoint (the 失败事件 nav item), so the list
  // matches the sidebar badge instead of just re-rendering the recent-100 list.
  const failedMode = params.get('type') === 'failed'
  const [activeType, setActiveType] = useState('all')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const tbodyRef = useRef(null)
  const topbarRef = useRef(null)
  const sidebarRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      if (failedMode) {
        // GET /__clockwork/failures → failure summaries, already filtered to failed by the backend
        // (same requestHasFailures definition the sidebar badge counts).
        const data = await api.failures({ limit: 100 })
        setRows((Array.isArray(data) ? data : []).map(toFailureRow))
      } else {
        // GET /__clockwork/latest + /__clockwork/{latest.id}/previous/99 → most-recent 100 requests
        const data = await api.recent(100)
        setRows(data.map(toListRow))
      }
    } catch (e) {
      setError(e.message || String(e))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [failedMode])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let r = rows
    // Type filtering is local for the recent list; the failures endpoint is already cross-type.
    if (!failedMode && activeType !== 'all') r = r.filter(x => x.type === activeType)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(x => x.uri.toLowerCase().includes(q) || (x.controller || '').toLowerCase().includes(q) || (x.failureMsg || '').toLowerCase().includes(q))
    }
    // Default order: most-recent first by occurrence time. The backend already returns rows newest
    // first (latest + previous ORDER BY id DESC), but we sort explicitly so the default is guaranteed
    // by the UI regardless of paging or backend changes.
    return [...r].sort((a, b) => (b.ts || 0) - (a.ts || 0))
  }, [rows, activeType, search, failedMode])

  // Stagger rows whenever the filtered set changes.
  useEffect(() => {
    if (!motionOk() || !tbodyRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('tr', { opacity: 0, y: 8, duration: 0.22, stagger: 0.014, ease: 'power2.out', clearProps: 'all' })
    }, tbodyRef)
    return () => ctx.revert()
  }, [filtered])

  // Entrance.
  useEffect(() => {
    if (!motionOk()) return
    const ctx = gsap.context(() => {
      gsap.from(sidebarRef.current, { opacity: 0, x: -24, duration: 0.3, ease: 'power2.out' })
      gsap.from(topbarRef.current, { opacity: 0, y: -8, duration: 0.25, ease: 'power2.out', delay: 0.08 })
    })
    return () => ctx.revert()
  }, [])

  function onRefresh(e) {
    if (motionOk()) gsap.to(e.currentTarget, { scale: 0.96, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.inOut' })
    setRefreshing(true)
    load().finally(() => setRefreshing(false))
  }

  return (
    <div className="request-list-page">
      <div ref={sidebarRef}><Sidebar /></div>

      <main className="main">
        <div className="topbar" ref={topbarRef}>
          <h1>{failedMode ? t('失败事件') : t('事件列表')}</h1>
          {!failedMode && (
            <div className="filter-group">
              {TYPE_FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`filter-pill ${activeType === f.key ? 'active' : ''}`}
                  onClick={() => setActiveType(f.key)}
                >
                  {f.icon && <Icon name={f.icon} size={12} />}
                  <span>{t(f.label)}</span>
                </button>
              ))}
            </div>
          )}
          <div className="spacer" />
          <button className="btn-refresh" onClick={onRefresh}>
            <Icon name="refresh" size={12} style={refreshing ? { animation: 'spin 0.6s linear infinite' } : undefined} />
            <span>{refreshing ? t('刷新中…') : t('刷新')}</span>
          </button>
          <input
            className="topbar-search"
            type="text"
            placeholder={t('搜索 URI / 控制器…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setSearch('') }}
          />
        </div>

        <div className="table-wrap">
          <table className="list-table">
            <thead>
              <tr>
                <th style={{ width: 68 }}>{t('状态')}</th>
                <th style={{ width: 90 }}>{t('类型')}</th>
                <th style={{ width: 68 }}>{t('方法')}</th>
                <th style={{ width: 'auto' }}>URI</th>
                <th style={{ width: 96 }}>{t('耗时')}</th>
                <th style={{ width: 96 }}>{t('内存')}</th>
                <th style={{ width: 168 }}>{t('时间')}</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {loading && (
                <tr><td colSpan={7}><div className="op-empty"><div className="empty-text">{t('加载中…')}</div></div></td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={7}><div className="op-empty"><div className="empty-text">{t('加载失败')}：{error}</div><div className="empty-sub">/__clockwork/{failedMode ? 'failures' : 'latest'}</div></div></td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={7}><div className="op-empty"><div className="empty-text">{failedMode ? t('暂无失败事件') : t('暂无事件')}</div></div></td></tr>
              )}
              {!loading && !error && filtered.map(r => {
                const { cls, widthPx } = durBar(r.dur)
                const slow = r.dur > 500
                return (
                  <tr
                    key={r.id}
                    className={r.failed ? 'row-failed' : ''}
                    onClick={() => navigate(`/requests/${r.id}`)}
                  >
                    <td>{r.failed && <span className="fail-dot" />}<StatusBadge status={r.status} exit={r.type === 'command'} /></td>
                    <td><TypeBadge type={r.type} size={11} /></td>
                    <td className="cell-method">{r.method}</td>
                    <td className="cell-uri" title={r.failureMsg || r.uri}>{r.uri}</td>
                    <td className={`cell-dur${slow ? ' slow' : ''}`}>
                      <span className={`dur-bar ${cls}`} style={{ width: widthPx }}>&nbsp;</span>{durStr(r.dur)}
                    </td>
                    <td className="cell-memory">{memStr(r.mem)}</td>
                    <td className="cell-time">{r.time}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
