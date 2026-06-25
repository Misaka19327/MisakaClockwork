import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { gsap, motionOk } from '../lib/motion.js'
import { statusClass, prettyVal, formatSql } from '../lib/format.js'
import Sidebar from '../components/Sidebar.jsx'
import Icon from '../components/Icon.jsx'
import { api, toDetail } from '../api/clockwork.js'
import { ExpandableCode, ExpandableTrace } from '../components/ExpandableCode.jsx'
import './request-detail.css'

const TABS = [
  { key: 'overview', label: '概览', icon: 'grid' },
  { key: 'performance', label: '性能', icon: 'chart', sub: '时间线' },
  { key: 'database', label: '数据库', icon: 'database' },
  { key: 'models', label: '模型', icon: 'box' },
  { key: 'cache', label: '缓存', icon: 'cache' },
  { key: 'redis', label: 'Redis', icon: 'redis' },
  { key: 'http', label: 'HTTP', icon: 'globe' },
  { key: 'log', label: '日志', icon: 'log' },
  { key: 'events', label: '事件', icon: 'events' },
  { key: 'views', label: '视图', icon: 'views' },
]

// Safely render KV values that may be objects/arrays (real Clockwork payloads carry
// nested objects in sessionData/headers etc.).
function fmtVal(v) {
  if (v == null) return '—'
  if (typeof v === 'object') {
    try { return JSON.stringify(v) } catch (_) { return String(v) }
  }
  return String(v)
}

function Kv({ k, v, title }) {
  const s = fmtVal(v)
  return (
    <div className="kv-row">
      <div className="kv-key">{k}</div>
      <div className="kv-val" title={title != null ? title : s}>{s}</div>
    </div>
  )
}

// Toggle a set of expanded row indices — multiple rows can be open at once (each click flips one).
function useToggleSet() {
  const [open, setOpen] = useState(() => new Set())
  const toggle = (i) => setOpen((prev) => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })
  return [open, toggle]
}

// items: [{ k, v, full? }] — k is a label, v is a string or JSX (badge / ExpandableCode /
// ExpandableTrace); full spans the whole grid row for long content. Renders the shared detail-grid.
function DetailFields({ items }) {
  return (
    <div className="detail-grid">
      {items.map((it, idx) => (
        <div key={idx} className={`detail-item${it.full ? ' full' : ''}`}>
          <span className="dk">{it.k}</span>
          <span className="dv">{it.v}</span>
        </div>
      ))}
    </div>
  )
}

function fmtDur(ms) {
  return ms > 1000 ? (ms / 1000).toFixed(1) + ' s' : ms.toFixed(1) + ' ms'
}
function fmtClock(unix) {
  try { return new Date(unix * 1000).toISOString().slice(11, 23) } catch (_) { return '—' }
}
function barClass(color) {
  return { blue: 'bar-blue', green: 'bar-green', purple: 'bar-purple', red: 'bar-red' }[color] || 'bar-grey'
}
// Sum a model-count map ({ ModelClass: count }) — counts may arrive as strings from storage.
const sumCounts = (obj) => Object.values(obj || {}).reduce((a, b) => a + (Number(b) || 0), 0)

export default function RequestDetail() {
  const { t } = useApp()
  const navigate = useNavigate()
  const { id } = useParams()
  const [d, setD] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('overview')
  const panelRef = useRef(null)

  // Fetch the full (extended) request by id; cancel on id change.
  // GET /__clockwork/{id}/extended → single request object with all data sources attached.
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null); setD(null); setTab('overview')
    api.extended(id)
      .then(raw => { if (!cancelled) setD(toDetail(raw)) })
      .catch(e => { if (!cancelled) setError(e) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const counts = d && {
    database: d.dbStats.count,
    models: sumCounts(d.modelsRetrieved) + sumCounts(d.modelsCreated) + sumCounts(d.modelsUpdated) + sumCounts(d.modelsDeleted),
    cache: d.cacheQueries.length,
    redis: d.redisCommands.length,
    http: d.httpRequests.length,
    log: d.logs.length,
    events: d.events.length,
    views: d.viewsData.length,
  }

  useEffect(() => {
    if (!motionOk() || !d) return
    const ctx = gsap.context(() => {
      gsap.from('.header-card', { opacity: 0, y: -12, duration: 0.35, ease: 'power2.out' })
      gsap.from('.tab-bar button', { opacity: 0, y: -8, duration: 0.25, stagger: 0.035, ease: 'power2.out', delay: 0.12 })
      if (d.failed) gsap.from('.failure-banner.show', { opacity: 0, y: -12, duration: 0.3, ease: 'power2.out', delay: 0.35 })
    })
    return () => ctx.revert()
  }, [d])

  // Animate panel entrance on tab change.
  useEffect(() => {
    if (!motionOk() || !panelRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo('.tab-panel', { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.15, ease: 'power2.out' })
      if (tab === 'performance') {
        gsap.fromTo('.tl-bar', { scaleX: 0, transformOrigin: 'left center' }, { scaleX: 1, duration: 0.5, stagger: 0.04, ease: 'power2.out', delay: 0.05 })
      }
    }, panelRef)
    return () => ctx.revert()
  }, [tab])

  const bars = useMemo(() => {
    if (!d) return []
    const total = d.totalDuration || 1
    const all = [
      ...d.timelineData.map(e => ({ label: e.description, start: e.start, end: e.end, color: e.color || 'grey' })),
      ...d.databaseQueries.map((q, i) => {
        const fs = [20, 70, 105, 160][i] || (180 + i * 8)
        const s = q.duration > 100 ? total - q.duration - (i * 5) : fs
        return { label: 'SQL #' + (i + 1), start: s, end: s + q.duration, color: (q.tags && q.tags.includes('slow')) ? 'red' : 'green' }
      }),
      ...d.httpRequests.map((r, i) => ({ label: 'HTTP #' + (i + 1), start: total - r.duration - 100 - i * 30, end: total - 100 - i * 30, color: 'purple' })),
      ...d.cacheQueries.map((c, i) => ({ label: 'Cache #' + (i + 1), start: 5 + i * 2, end: 5 + i * 2 + (c.duration || 0.5), color: 'grey' })),
    ]
    return all.sort((a, b) => a.start - b.start)
  }, [d])

  const pct = (v) => d && d.totalDuration ? Math.max(0, Math.min(100, (v / d.totalDuration) * 100)) : 0

  return (
    <div className="request-detail-page">
      <Sidebar />

      <main className="main">
        {loading && (
          <div className="op-empty"><div className="empty-text">{t('加载中…')}</div></div>
        )}
        {!loading && error && (
          <div className="op-empty">
            <div className="empty-text">{error.status === 404 ? t('请求未找到') : (error.message || String(error))}</div>
            <button className="btn-refresh" style={{ marginTop: 12 }} onClick={() => navigate('/requests')}>{t('返回列表')}</button>
          </div>
        )}
        {d && (
        <>
        <div className="header-card">
          <button className="back-btn" title={t('返回列表')} onClick={() => navigate('/requests')}>←</button>
          <div className="header-meta">
            <span className="req-method">{d.method}</span>
            <span className="req-uri">{d.uri}</span>
            <span className={`req-status ${statusClass(d.status)}`}>{d.status}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{d.controller}</span>
          </div>
          <div className="header-stats">
            <div className="header-stat"><div className="stat-val">{fmtDur(d.duration)}</div><div className="stat-lbl">{t('耗时')}</div></div>
            <div className="header-stat"><div className="stat-val">{(d.memory / 1e6).toFixed(1)} MB</div><div className="stat-lbl">{t('内存')}</div></div>
            <div className="header-stat"><div className="stat-val">{d.dbStats.count}</div><div className="stat-lbl">{t('查询')}</div></div>
            <div className="header-stat"><div className="stat-val">{d.dbStats.slow}</div><div className="stat-lbl">{t('慢查询')}</div></div>
          </div>
        </div>

        <div className={`failure-banner ${d.failed ? 'show' : ''}`}>
          <strong><Icon name="warning" size={14} /> {t('请求失败')}</strong> — <span>{d.failureMsg}</span>
        </div>

        <div className="tab-bar">
          {TABS.map(tb => (
            <button key={tb.key} className={tab === tb.key ? 'active' : ''} onClick={() => setTab(tb.key)}>
              <Icon name={tb.icon} size={13} />
              <span>{t(tb.label)}</span>
              {tb.sub && <span className="tab-count">{t(tb.sub)}</span>}
              {counts[tb.key] != null && <span className="tab-count">{counts[tb.key]}</span>}
            </button>
          ))}
        </div>

        <div className="tab-content" ref={panelRef}>
          <div className="tab-panel">
            {tab === 'overview' && <OverviewPanel d={d} t={t} />}
            {tab === 'performance' && <PerformancePanel d={d} t={t} bars={bars} pct={pct} />}
            {tab === 'database' && <DatabasePanel d={d} t={t} />}
            {tab === 'models' && <ModelsPanel d={d} t={t} />}
            {tab === 'cache' && <CachePanel d={d} t={t} />}
            {tab === 'redis' && <RedisPanel d={d} t={t} />}
            {tab === 'http' && <HttpPanel d={d} t={t} />}
            {tab === 'log' && <LogPanel d={d} t={t} />}
            {tab === 'events' && <EventsPanel d={d} t={t} />}
            {tab === 'views' && <ViewsPanel d={d} t={t} />}
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  )
}

/* ── Panels ── */

function OverviewPanel({ d, t }) {
  const emptyNone = (label) => (
    <div className="kv-list"><div className="kv-row"><div className="kv-key" style={{ width: '100%', textAlign: 'center', color: 'var(--muted)' }}>（{label}）</div></div></div>
  )
  return (
    <>
      <div className="section-title">{t('请求与响应上下文')}</div>
      <div className="kv-list mb12">
        <Kv k="ID" v={d.id} />
        <Kv k={t('类型')} v={d.type} />
        <Kv k={t('时间')} v={d.timeStr} />
        <Kv k={t('方法')} v={d.method} />
        <Kv k="URI" v={d.uri} />
        <Kv k={t('状态')} v={String(d.status)} />
      </div>

      <div className="section-title mt20">{t('Query 参数')}</div>
      <div className="kv-list mb12">
        {Object.keys(d.getData).length
          ? Object.entries(d.getData).map(([k, v]) => <Kv key={k} k={k} v={String(v)} />)
          : <div className="kv-row"><div className="kv-key" style={{ width: '100%', textAlign: 'center', color: 'var(--muted)' }}>（{t('无')}）</div></div>}
      </div>

      <div className="section-title mt20">{t('请求头')}</div>
      <div className="kv-list mb12">
        {Object.entries(d.headers).map(([k, v]) => <Kv key={k} k={k} v={String(v)} />)}
      </div>

      <div className="section-title mt20">{t('已认证用户')}</div>
      <div className="kv-list mb12">
        {d.authenticatedUser
          ? Object.entries(d.authenticatedUser).map(([k, v]) => <Kv key={k} k={k} v={String(v)} />)
          : <div className="kv-row"><div className="kv-key" style={{ width: '100%', textAlign: 'center', color: 'var(--muted)' }}>（{t('未认证')}）</div></div>}
      </div>

      <div className="section-title mt20">{t('中间件')}</div>
      <div className="kv-list">
        {d.middleware.map(m => (
          <div className="kv-row" key={m}><div className="kv-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{m}</div></div>
        ))}
      </div>
    </>
  )
}

function PerformancePanel({ d, t, bars, pct }) {
  return (
    <>
      <div className="detail-kpi-row">
        <div className="kpi-card"><div className="kpi-val">{d.dbStats.count}</div><div className="kpi-lbl">{t('数据库查询')}</div></div>
        <div className="kpi-card"><div className="kpi-val">{d.dbStats.slow}</div><div className="kpi-lbl">{t('慢查询')}</div></div>
        <div className="kpi-card"><div className="kpi-val">{d.dbStats.duration.toFixed(0)} ms</div><div className="kpi-lbl">DB {t('总耗时')}</div></div>
        <div className="kpi-card"><div className="kpi-val">{d.cacheStats.reads}</div><div className="kpi-lbl">{t('缓存')}</div></div>
        <div className="kpi-card"><div className="kpi-val">{d.cacheStats.hits}/{d.cacheStats.reads}</div><div className="kpi-lbl">{t('命中率')}</div></div>
      </div>

      <div className="timeline-wrap">
        <h3><Icon name="clock" size={14} /> {t('时间线')}</h3>
        <div className="tl-legend">
          <span><span className="swatch" style={{ background: 'oklch(55% 0.14 250)' }} />{t('控制器 / 框架')}</span>
          <span><span className="swatch" style={{ background: 'oklch(50% 0.14 150)' }} />{t('数据库')}</span>
          <span><span className="swatch" style={{ background: 'oklch(50% 0.14 290)' }} />{t('HTTP / 中间件')}</span>
          <span><span className="swatch" style={{ background: 'var(--danger)' }} />{t('慢查询 / 错误')}</span>
          <span><span className="swatch" style={{ background: 'oklch(55% 0.01 250)' }} />{t('缓存 / 其他')}</span>
        </div>
        <div className="tl-axis">
          <span>0 ms</span>
          <span>{(d.totalDuration / 4).toFixed(0)} ms</span>
          <span>{(d.totalDuration / 2).toFixed(0)} ms</span>
          <span>{(d.totalDuration * 0.75).toFixed(0)} ms</span>
          <span>{d.totalDuration.toFixed(0)} ms</span>
        </div>
        {bars.map((b, i) => (
          <div className="tl-row" key={i}>
            <div className="tl-label">{b.label}</div>
            <div className="tl-track">
              <div className={`tl-bar ${barClass(b.color)}`} style={{ left: pct(b.start) + '%', width: Math.max(pct(b.end - b.start), 0.3) + '%' }}>
                {(b.end - b.start).toFixed(1)} ms
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function DatabasePanel({ d, t }) {
  const [open, toggle] = useToggleSet()
  return (
    <>
      <div className="section-title">{t('数据库查询')} <span className="count">({d.dbStats.count})</span></div>
      <table className="data-table mb12">
        <thead><tr><th>#</th><th>{t('SQL')}</th><th>{t('耗时')}</th><th>{t('连接')}</th><th>{t('来源')}</th></tr></thead>
        <tbody>
          {d.databaseQueries.flatMap((q, i) => {
            const isExp = open.has(i)
            const main = (
              <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => toggle(i)}>
                <td className="mono">{i + 1}</td>
                <td className="sql-cell" title={q.query}>
                  {q.query}
                  {q.tags && q.tags.includes('slow') && <span className="tag-slow">{t('慢')}</span>}
                  {q.tags && q.tags.includes('n+1') && <span className="tag-n1">N+1</span>}
                </td>
                <td className="dur-cell">{q.duration.toFixed(1)} ms</td>
                <td className="mono">{q.connection}</td>
                <td className="mono">{q.file}:{q.line}</td>
              </tr>
            )
            if (!isExp) return [main]
            return [main, (
              <tr key={`d${i}`} className="detail-row">
                <td colSpan={5}>
                  <div className="detail-panel">
                    <DetailFields items={[
                      { k: t('类型'), v: q.type ? <span className={`cell-type-badge ${q.type}`}>{q.type}</span> : '—' },
                      { k: t('模型'), v: q.model || '—' },
                      { k: t('标签'), v: (q.tags && q.tags.length) ? q.tags.map(tg => <span key={tg} className={tg === 'slow' ? 'tag-slow' : 'tag-n1'}>{tg}</span>) : '—' },
                      { k: t('绑定值'), v: <ExpandableCode text={JSON.stringify(q.bindings ?? {}, null, 2)} />, full: true },
                      { k: t('结果'), v: q.resultAvailable ? <ExpandableCode text={prettyVal(q.result) ?? ''} /> : <span style={{ color: 'var(--muted)' }}>{q.resultUnavailableReason || t('未捕获查询结果')}</span>, full: true },
                      { k: t('调用栈'), v: <ExpandableTrace trace={q.trace || []} />, full: true },
                      { k: t('完整 SQL'), v: <ExpandableCode text={formatSql(q.query)} />, full: true },
                    ]} />
                  </div>
                </td>
              </tr>
            )]
          })}
        </tbody>
      </table>
    </>
  )
}

function ModelsPanel({ d, t }) {
  const [open, toggle] = useToggleSet()
  const actions = d.modelsActions || []
  const ACTION_LABEL = { retrieved: '检索', created: '新建', updated: '更新', deleted: '删除' }
  const allModels = Array.from(new Set([
    ...Object.keys(d.modelsRetrieved || {}),
    ...Object.keys(d.modelsCreated || {}),
    ...Object.keys(d.modelsUpdated || {}),
    ...Object.keys(d.modelsDeleted || {}),
  ]))
  const cnt = (map, m) => Number((d[map] || {})[m] || 0)

  return (
    <>
      <div className="section-title">{t('模型操作')} <span className="count">({actions.length})</span></div>

      {allModels.length > 0 && (
        <div className="model-summary">
          {allModels.map(m => (
            <div key={m} className="model-card">
              <span className="model-name" title={m}>{m.split('\\').pop() || m}</span>
              <span className="model-counts">
                {cnt('modelsRetrieved', m) > 0 && <span className="model-chip retrieved">{cnt('modelsRetrieved', m)} {t('检索')}</span>}
                {cnt('modelsCreated', m) > 0 && <span className="model-chip created">{cnt('modelsCreated', m)} {t('新建')}</span>}
                {cnt('modelsUpdated', m) > 0 && <span className="model-chip updated">{cnt('modelsUpdated', m)} {t('更新')}</span>}
                {cnt('modelsDeleted', m) > 0 && <span className="model-chip deleted">{cnt('modelsDeleted', m)} {t('删除')}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <table className="data-table">
        <thead><tr><th>#</th><th>{t('模型')}</th><th>{t('操作')}</th><th>{t('主键')}</th><th>{t('耗时')}</th><th>{t('关联 SQL')}</th></tr></thead>
        <tbody>
          {actions.flatMap((a, i) => {
            const isExp = open.has(i)
            const main = (
              <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => toggle(i)}>
                <td className="mono">{i + 1}</td>
                <td className="mono" title={a.model}>{(a.model || '').split('\\').pop() || '—'}</td>
                <td><span className={`model-action-badge ${a.action}`}>{t(ACTION_LABEL[a.action] || a.action)}</span></td>
                <td className="mono">{a.key == null ? '—' : String(a.key)}</td>
                <td className="dur-cell">{a.duration != null ? `${Number(a.duration).toFixed(1)} ms` : '—'}</td>
                <td className="sql-cell" title={a.query}>{a.query || '—'}</td>
              </tr>
            )
            if (!isExp) return [main]
            return [main, (
              <tr key={`d${i}`} className="detail-row">
                <td colSpan={6}>
                  <div className="detail-panel">
                    <DetailFields items={[
                      { k: t('模型'), v: <code>{a.model || '—'}</code> },
                      { k: t('操作'), v: <span className={`model-action-badge ${a.action}`}>{t(ACTION_LABEL[a.action] || a.action)}</span> },
                      { k: t('主键'), v: a.key == null ? '—' : String(a.key) },
                      ...(Object.keys(a.changes || {}).length ? [{ k: t('改动'), v: <ExpandableCode text={prettyVal(a.changes)} />, full: true }] : []),
                      ...(Object.keys(a.attributes || {}).length ? [{ k: t('属性'), v: <ExpandableCode text={prettyVal(a.attributes)} />, full: true }] : []),
                      { k: t('关联 SQL'), v: a.query ? <ExpandableCode text={formatSql(a.query)} /> : '—', full: true },
                      { k: t('调用栈'), v: <ExpandableTrace trace={a.trace || []} />, full: true },
                    ]} />
                  </div>
                </td>
              </tr>
            )]
          })}
          {actions.length === 0 && (
            <tr><td colSpan={6}><div className="empty-text">{t('无模型操作流水（默认仅采集写操作）')}</div></td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}

function CachePanel({ d, t }) {
  const [open, toggle] = useToggleSet()
  return (
    <>
      <div className="section-title">{t('缓存操作')} <span className="count">({d.cacheQueries.length})</span></div>
      <table className="data-table">
        <thead><tr><th>{t('类型')}</th><th>{t('键')}</th><th>{t('值')}</th><th>{t('耗时')}</th><th>{t('连接')}</th></tr></thead>
        <tbody>
          {d.cacheQueries.flatMap((c, i) => {
            const isExp = open.has(i)
            const main = (
              <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => toggle(i)}>
                <td><span className={`cache-type ${c.type}`}>{c.type}</span></td>
                <td className="mono">{c.key}</td>
                <td className="mono" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fmtVal(c.value)}>{fmtVal(c.value)}</td>
                <td className="dur-cell">{c.duration ? c.duration.toFixed(1) + ' ms' : '—'}</td>
                <td className="mono">{c.connection}</td>
              </tr>
            )
            if (!isExp) return [main]
            return [main, (
              <tr key={`d${i}`} className="detail-row">
                <td colSpan={5}>
                  <div className="detail-panel">
                    <DetailFields items={[
                      { k: t('过期'), v: c.expiration ? `${c.expiration} s` : '—' },
                      { k: t('完整值'), v: <ExpandableCode text={prettyVal(c.value) ?? '—'} />, full: true },
                    ]} />
                  </div>
                </td>
              </tr>
            )]
          })}
        </tbody>
      </table>
    </>
  )
}

function RedisPanel({ d, t }) {
  const [open, toggle] = useToggleSet()
  return (
    <>
      <div className="section-title">{t('Redis 命令')} <span className="count">({d.redisCommands.length})</span></div>
      <table className="data-table">
        <thead><tr><th>{t('命令')}</th><th>{t('键')}</th><th>{t('参数')}</th><th>{t('耗时')}</th></tr></thead>
        <tbody>
          {d.redisCommands.flatMap((r, i) => {
            const isExp = open.has(i)
            const main = (
              <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => toggle(i)}>
                <td className="mono" style={{ fontWeight: 590 }}>{r.command}</td>
                <td className="mono">{r.key || '—'}</td>
                <td className="mono" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fmtVal(r.parameters)}>{fmtVal(r.parameters)}</td>
                <td className="dur-cell">{r.duration.toFixed(1)} ms</td>
              </tr>
            )
            if (!isExp) return [main]
            return [main, (
              <tr key={`d${i}`} className="detail-row">
                <td colSpan={4}>
                  <div className="detail-panel">
                    <DetailFields items={[
                      { k: t('连接'), v: r.connection || '—' },
                      { k: t('完整参数'), v: <ExpandableCode text={JSON.stringify(r.parameters ?? [], null, 2)} />, full: true },
                    ]} />
                  </div>
                </td>
              </tr>
            )]
          })}
        </tbody>
      </table>
    </>
  )
}

function HttpPanel({ d, t }) {
  const [open, toggle] = useToggleSet()
  return (
    <>
      <div className="section-title">{t('出站 HTTP 请求')} <span className="count">({d.httpRequests.length})</span></div>
      <table className="data-table">
        <thead><tr><th>{t('方法')}</th><th>URL</th><th>{t('状态')}</th><th>{t('耗时')}</th><th>{t('错误')}</th></tr></thead>
        <tbody>
          {d.httpRequests.flatMap((r, i) => {
            const isExp = open.has(i)
            const bad = (r.response && r.response.status >= 400) || r.error
            const main = (
              <tr key={`r${i}`} className={isExp ? 'expanded' : ''} style={bad ? { background: 'oklch(96% 0.015 25)' } : undefined} onClick={() => toggle(i)}>
                <td className="mono" style={{ fontWeight: 590 }}>{r.request.method}</td>
                <td className="mono" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.request.url}>{r.request.url}</td>
                <td className="mono">{r.response ? r.response.status : '—'}</td>
                <td className="dur-cell">{r.duration.toFixed(1)} ms</td>
                <td className="mono" style={{ color: 'var(--danger)' }}>{r.error || '—'}</td>
              </tr>
            )
            if (!isExp) return [main]
            return [main, (
              <tr key={`d${i}`} className="detail-row">
                <td colSpan={5}>
                  <div className="detail-panel">
                    <DetailFields items={[
                      { k: t('请求头'), v: <ExpandableCode text={JSON.stringify(r.request?.headers ?? {}, null, 2)} />, full: true },
                      { k: t('请求体'), v: <ExpandableCode text={fmtVal(r.request?.body)} />, full: true },
                      { k: t('响应头'), v: <ExpandableCode text={JSON.stringify(r.response?.headers ?? {}, null, 2)} />, full: true },
                      { k: t('响应体'), v: <ExpandableCode text={fmtVal(r.response?.body)} />, full: true },
                    ]} />
                  </div>
                </td>
              </tr>
            )]
          })}
        </tbody>
      </table>
    </>
  )
}

function LogPanel({ d, t }) {
  const [open, toggle] = useToggleSet()
  return (
    <>
      <div className="section-title">{t('日志记录')} <span className="count">({d.logs.length})</span></div>
      <table className="data-table">
        <thead><tr><th>{t('级别')}</th><th>{t('消息')}</th><th>{t('时间')}</th></tr></thead>
        <tbody>
          {d.logs.flatMap((l, i) => {
            const isExp = open.has(i)
            const main = (
              <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => toggle(i)}>
                <td><span className={`log-level ${l.level}`}>{l.level}</span></td>
                <td>{l.message}</td>
                <td className="mono">{fmtClock(l.time)}</td>
              </tr>
            )
            if (!isExp) return [main]
            return [main, (
              <tr key={`d${i}`} className="detail-row">
                <td colSpan={3}>
                  <div className="detail-panel">
                    <DetailFields items={[
                      { k: t('上下文'), v: <ExpandableCode text={JSON.stringify(l.context ?? {}, null, 2)} />, full: true },
                      { k: t('调用栈'), v: <ExpandableTrace trace={l.trace || []} />, full: true },
                    ]} />
                  </div>
                </td>
              </tr>
            )]
          })}
        </tbody>
      </table>
    </>
  )
}

function EventsPanel({ d, t }) {
  const [open, toggle] = useToggleSet()
  return (
    <>
      <div className="section-title">{t('事件派发')} <span className="count">({d.events.length})</span></div>
      <table className="data-table">
        <thead><tr><th>{t('事件')}</th><th>{t('数据')}</th><th>{t('监听器')}</th><th>{t('耗时')}</th></tr></thead>
        <tbody>
          {d.events.flatMap((e, i) => {
            const isExp = open.has(i)
            const main = (
              <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => toggle(i)}>
                <td className="mono" style={{ fontSize: 11 }}>{e.event}</td>
                <td className="mono" style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fmtVal(e.data)}>{fmtVal(e.data)}</td>
                <td className="mono" style={{ fontSize: 11 }}>{(e.listeners || []).join(', ') || '—'}</td>
                <td className="dur-cell">{e.duration ? e.duration.toFixed(1) + ' ms' : '—'}</td>
              </tr>
            )
            if (!isExp) return [main]
            return [main, (
              <tr key={`d${i}`} className="detail-row">
                <td colSpan={4}>
                  <div className="detail-panel">
                    <DetailFields items={[
                      { k: t('时间'), v: fmtClock(e.time) },
                      { k: t('完整载荷'), v: <ExpandableCode text={JSON.stringify(e.data ?? {}, null, 2)} />, full: true },
                    ]} />
                  </div>
                </td>
              </tr>
            )]
          })}
        </tbody>
      </table>
    </>
  )
}

function ViewsPanel({ d, t }) {
  const [open, toggle] = useToggleSet()
  return (
    <>
      <div className="section-title">{t('视图渲染')} <span className="count">({d.viewsData.length})</span></div>
      <table className="data-table">
        <thead><tr><th>{t('视图')}</th><th>{t('耗时')}</th></tr></thead>
        <tbody>
          {d.viewsData.flatMap((v, i) => {
            const isExp = open.has(i)
            const main = (
              <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => toggle(i)}>
                <td className="mono">{v.data.name}</td>
                <td className="dur-cell">{v.duration.toFixed(1)} ms</td>
              </tr>
            )
            if (!isExp) return [main]
            return [main, (
              <tr key={`d${i}`} className="detail-row">
                <td colSpan={2}>
                  <div className="detail-panel">
                    <DetailFields items={[
                      { k: t('描述'), v: v.description || '—' },
                      { k: t('时间区间'), v: `${v.start ?? '—'} → ${v.end ?? '—'}` },
                      { k: t('完整数据'), v: <ExpandableCode text={JSON.stringify(v.data ?? {}, null, 2)} />, full: true },
                    ]} />
                  </div>
                </td>
              </tr>
            )]
          })}
        </tbody>
      </table>
    </>
  )
}
