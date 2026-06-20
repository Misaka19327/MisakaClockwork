import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { gsap, motionOk } from '../lib/motion.js'
import { durStr } from '../lib/format.js'
import BrandMark from '../components/BrandMark.jsx'
import UtilToggles from '../components/UtilToggles.jsx'
import { MethodBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx'
import { api, toListRow } from '../api/clockwork.js'
import './overview.css'

export default function Overview() {
  const { t } = useApp()
  const navigate = useNavigate()
  const rootRef = useRef(null)

  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      // GET /__clockwork/stats (KPIs) and /recent (recent-requests table) in parallel.
      const [s, rec] = await Promise.all([api.stats(), api.recent(10)])
      setStats(s)
      setRecent(Array.isArray(rec) ? rec : [])
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Entrance animation once data has arrived.
  useEffect(() => {
    if (loading || !motionOk() || !rootRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.status-bar', { opacity: 0, y: 8, duration: 0.25, ease: 'power2.out' })
      gsap.from('.kpi-row.overview .kpi-card', { opacity: 0, y: 12, duration: 0.28, stagger: 0.06, ease: 'power2.out', delay: 0.08, clearProps: 'all' })
      gsap.from('.section-hd', { opacity: 0, x: -6, duration: 0.22, stagger: 0.06, ease: 'power2.out', delay: 0.25, clearProps: 'all' })
      gsap.from('.recent-table tbody tr', { opacity: 0, x: -8, duration: 0.24, stagger: 0.04, ease: 'power2.out', delay: 0.3, clearProps: 'opacity,transform' })
    }, rootRef)
    return () => ctx.revert()
  }, [loading])

  const rows = recent.map(toListRow)
  const lastCollected = recent[0]?.time ? Math.max(0, Math.floor(Date.now() / 1000 - recent[0].time)) : null
  const db = stats?.database || {}
  const fmt = (n) => Number(n || 0).toLocaleString()

  return (
    <div className="overview-page" ref={rootRef}>
      <nav className="topnav">
        <div className="logo">
          <BrandMark size={24} />
          <span>{t('Clockwork')}</span>
        </div>
        <div className="spacer" />
        <span className="env-badge">{t('local')}</span>
        <UtilToggles />
      </nav>

      <main className="overview-main">
        {loading && <div className="empty-state"><div className="empty-text">{t('加载中…')}</div></div>}

        {!loading && error && (
          <div className="empty-state">
            <div className="empty-text">{t('加载失败')}：{error}</div>
            <div className="empty-sub">/__clockwork/stats</div>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            <section className="status-bar">
              <div className="status-dot" />
              <span className="status-label">{t('收集器运行中')}</span>
              <div className="status-meta">
                <span>{t('请求')} <b>{fmt(stats.requests)}</b></span><span className="sep">|</span>
                <span>{t('失败')} <b>{fmt(stats.failedRequests)}</b></span><span className="sep">|</span>
                <span>{t('最后收集')} <b>{lastCollected != null ? `${lastCollected} ${t('秒前')}` : '—'}</b></span>
              </div>
            </section>

            <div className="kpi-row overview">
              <div className="kpi-card">
                <div className="kpi-lbl">{t('请求总数')}</div>
                <div className="kpi-body"><div className="kpi-val">{fmt(stats.requests)}</div></div>
                <div className="kpi-sub">{t('失败')} {fmt(stats.failedRequests)} · {t('命令')} {fmt(stats.byType?.command)} · {t('队列')} {fmt(stats.byType?.['queue-job'])}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-lbl">{t('失败请求')}</div>
                <div className="kpi-body"><div className="kpi-val">{fmt(stats.failedRequests)}</div></div>
                <div className="kpi-sub">{t('错误率')} {stats.errorRate}%</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-lbl">{t('平均耗时')}</div>
                <div className="kpi-body"><div className="kpi-val">{stats.avgDuration}</div></div>
                <div className="kpi-sub">{t('单位 ms')}</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-lbl">{t('数据库查询')}</div>
                <div className="kpi-body"><div className="kpi-val">{fmt(db.queries)}</div></div>
                <div className="kpi-sub">{t('慢查询')} {fmt(db.slow)} {t('条')} · {t('总耗时')} {(Number(db.duration || 0) / 1000).toFixed(1)}s</div>
              </div>
            </div>

            <div className="section-hd">{t('最近请求')}</div>
            <div className="table-scroll">
              <table className="recent-table">
                <thead>
                  <tr>
                    <th className="method-col">{t('方法')}</th>
                    <th className="uri-col">URI</th>
                    <th className="type-col">{t('类型')}</th>
                    <th className="status-col">{t('状态')}</th>
                    <th className="dur-col">{t('耗时')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)' }}>{t('暂无请求')}</td></tr>
                  )}
                  {rows.map((r) => {
                    const slow = r.type === 'request' && r.dur > 300
                    const isCmd = r.type === 'command'
                    return (
                      <tr
                        key={r.id}
                        tabIndex={0}
                        role="link"
                        onClick={() => navigate(`/requests/${r.id}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/requests/${r.id}`) } }}
                      >
                        <td><MethodBadge method={r.method} /></td>
                        <td className="uri-col">{r.uri}</td>
                        <td><TypeBadge type={r.type} /></td>
                        <td>{isCmd ? <StatusBadge status={r.status} exit /> : <StatusBadge status={r.status} />}</td>
                        <td className={slow ? 'p--slow' : ''}>{durStr(r.dur)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <a href="/requests" onClick={(e) => { e.preventDefault(); navigate('/requests') }}>
                {t('查看全部')} →
              </a>
            </div>
          </>
        )}
      </main>

      <footer className="overview-footer">
        Clockwork 5.x · {t('数据保留周期 7 天 · 支持 HTTP 请求 / Artisan 命令 / 队列任务 / 测试')}
      </footer>
    </div>
  )
}
