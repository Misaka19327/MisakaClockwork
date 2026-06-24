import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import BrandMark from './BrandMark.jsx'
import Icon from './Icon.jsx'
import UtilToggles from './UtilToggles.jsx'
import { useApp } from '../context/AppContext.jsx'
import { CATEGORY_ORDER, CATEGORIES } from '../data/operations.js'
import { api } from '../api/clockwork.js'

// Sidebar badges (request count, failures, per-category operation counts) are fed by
// /__clockwork/stats. The promise is cached at module scope so the sidebar remounting on route
// changes doesn't re-fetch — a full page reload resets it. On load/error badges show "—" rather
// than any stale hardcoded number.
let statsPromise = null
function loadStats() {
  if (!statsPromise) {
    // Drop the cache on failure so a retry can fire next mount.
    statsPromise = api.stats().catch((e) => { statsPromise = null; throw e })
  }
  return statsPromise
}

// Compact badge formatting: 5800 -> "5.8k", 58000 -> "58k", 856 -> "856".
function badge(n) {
  n = Number(n) || 0
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)
}

// Map a sidebar category to its live count from the stats payload.
function categoryCount(stats, key) {
  if (!stats) return null
  switch (key) {
    case 'database': return stats.database?.queries
    case 'cache': return (Number(stats.cache?.reads) || 0) + (Number(stats.cache?.writes) || 0)
    case 'redis': return stats.redis?.commands
    case 'log': return stats.log?.total
    case 'events': return stats.events?.count
    case 'views': return stats.views?.count
    case 'notifications': return stats.notifications?.count
    default: return null
  }
}

function useStats() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    let alive = true
    loadStats().then((s) => { if (alive) setStats(s) }).catch(() => { /* badges stay "—" */ })
    return () => { alive = false }
  }, [])
  return stats
}

// The sidebar renders the same set of nav items on every page; only the active highlight follows
// the current route. This keeps the left rail identical across 事件列表 / 操作中心 / 请求详情.
export default function Sidebar() {
  const { t } = useApp()
  const stats = useStats()
  const { pathname } = useLocation()
  const [params] = useSearchParams()

  const reqBadge = stats ? badge(stats.requests) : '—'
  const failedBadge = stats ? badge(stats.failedRequests) : '—'

  // Active state is derived purely from the route so every page shows the same rail.
  const isFailed = params.get('type') === 'failed'
  const overviewActive = pathname === '/'
  const failedActive = pathname === '/requests' && isFailed
  const reqActive = (pathname === '/requests' && !isFailed) || pathname.startsWith('/requests/')
  const activeCat = pathname === '/operations' ? (params.get('category') || 'database') : null

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/" aria-label={t('回到主页')}>
          <BrandMark size={28} />
          <span>{t('Clockwork')}</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <Link to="/" className={overviewActive ? 'active' : ''}>
          <Icon name="grid" size={14} /> <span>{t('总览')}</span>
        </Link>
        <Link to="/requests" className={reqActive ? 'active' : ''}>
          <Icon name="list" size={14} /> <span>{t('事件列表')}</span>
          <span className="nav-badge">{reqBadge}</span>
        </Link>
        <Link to="/requests?type=failed" className={failedActive ? 'active' : ''}>
          <Icon name="warning" size={14} /> <span>{t('失败事件')}</span>
          <span className="nav-badge">{failedBadge}</span>
        </Link>

        <div className="nav-section">{t('操作中心')}</div>
        {CATEGORY_ORDER.map((key) => {
          const cat = CATEGORIES[key]
          const isActive = activeCat != null && key === activeCat
          const count = categoryCount(stats, key)
          return (
            <Link
              key={key}
              to={`/operations?category=${key}`}
              id={`nav-${key}`}
              className={isActive ? 'active' : ''}
            >
              <Icon name={cat.icon} size={14} />
              <span>{t(cat.name)}</span>
              <span className="nav-badge">{count != null ? badge(count) : '—'}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div>
          <span className="dot" />
          {t('已连接')} — {t('收集')} {reqBadge} {t('条请求')}
        </div>
        <div className="util-toggles" style={{ marginTop: 8 }}>
          <UtilToggles />
        </div>
      </div>
    </aside>
  )
}
