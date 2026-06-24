import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { gsap, motionOk } from '../lib/motion.js'
import { durBar, durStr, memStr } from '../lib/format.js'
import Sidebar from '../components/Sidebar.jsx'
import Icon from '../components/Icon.jsx'
import { MethodBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx'
import { api, toListRow, toFailureRow } from '../api/clockwork.js'
import { usePagedList } from '../hooks/usePagedList.js'
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
  const [refreshing, setRefreshing] = useState(false)
  const tbodyRef = useRef(null)
  const topbarRef = useRef(null)
  const sidebarRef = useRef(null)
  const scrollRef = useRef(null)

  // Type filtering is server-side: 'all' omits the type param; anything else is forwarded to
  // latest/previous (and to /failures, which already accepts type). Switching type therefore has
  // to reset paging from page 0 — handled by the reload effect below.
  const typeParam = activeType === 'all' ? {} : { type: activeType }

  const fetch = useCallback(async (pageState, batchSize) => {
    if (failedMode) {
      // /failures is cursor-paged: resume from nextCursor (null on the first batch).
      const cursor = pageState?.nextCursor ?? null
      const { failures, nextCursor } = await api.failures({ ...(cursor ? { cursor } : {}), ...typeParam, limit: batchSize })
      const items = failures.map(toFailureRow)
      return { items, nextPageState: { nextCursor }, hasMore: !!nextCursor }
    }
    // recent/previous are id-cursor paged. The first batch resolves the latest id then pages back
    // from it; subsequent batches page back from the last id of the previous batch.
    if (pageState === null) {
      const items = (await api.recent(batchSize, typeParam)).map(toListRow)
      return { items, nextPageState: { lastId: items.length ? items[items.length - 1].id : null }, hasMore: items.length === batchSize }
    }
    const lastId = pageState.lastId
    if (!lastId) return { items: [], nextPageState: pageState, hasMore: false }
    const items = (await api.previous(lastId, batchSize, typeParam)).map(toListRow)
    return { items, nextPageState: { lastId: items.length ? items[items.length - 1].id : null }, hasMore: items.length === batchSize }
  }, [failedMode, typeParam])

  const { items: rows, loading, error, hasMore, reload, loadMore, sentinelRef } = usePagedList({ fetch, batchSize: 50, rootRef: scrollRef })

  // Server-side reset when the type filter or failure mode changes. The hook's own mount effect
  // already fires the initial batch, so we skip the first run here to avoid a double initial fetch.
  const firstRunRef = useRef(true)
  useEffect(() => {
    if (firstRunRef.current) { firstRunRef.current = false; return }
    reload()
  }, [activeType, failedMode, reload])

  const filtered = useMemo(() => {
    let r = rows
    // Search stays client-side over the already-loaded rows. Type filtering is now server-side
    // (typeParam above), so it is deliberately NOT applied here.
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(x => x.uri.toLowerCase().includes(q) || (x.controller || '').toLowerCase().includes(q) || (x.failureMsg || '').toLowerCase().includes(q))
    }
    // Newest-first is already guaranteed by the backend (latest + previous ORDER BY id DESC, and
    // /failures returns newest first); we preserve paging order rather than re-sorting.
    return r
  }, [rows, search])

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
    reload().finally(() => setRefreshing(false))
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

        <div className="table-wrap" ref={scrollRef}>
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
              {!loading && !error && hasMore && (
                <tr ref={sentinelRef}><td colSpan={7}><div className="op-empty"><div className="empty-text">{t('加载中…')}</div></div></td></tr>
              )}
              {!loading && !error && !hasMore && rows.length > 0 && (
                <tr><td colSpan={7}><div className="op-empty"><div className="empty-text">{t('没有更早的记录了')}</div></div></td></tr>
              )}
              {error && rows.length > 0 && (
                <tr><td colSpan={7}><div className="op-empty"><div className="empty-text">{t('加载失败')}：{error} <button className="btn" onClick={loadMore}>{t('重试')}</button></div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
