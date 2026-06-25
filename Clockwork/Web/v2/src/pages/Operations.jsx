import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { gsap, motionOk } from '../lib/motion.js'
import Sidebar from '../components/Sidebar.jsx'
import Icon from '../components/Icon.jsx'
import { ExpandableCode, ExpandableTrace } from '../components/ExpandableCode.jsx'
import { api, normalizeKpi } from '../api/clockwork.js'
import { usePagedList } from '../hooks/usePagedList.js'
import { CATEGORY_ORDER } from '../data/operations.js'
import './operations.css'

// Static UI config per category (data now comes from /__clockwork/operations/{category}).
const CATEGORY_UI = {
  database: {
    icon: 'database', title: '数据库查询', filterPlaceholder: '搜索 SQL / 连接 / 文件…',
    cols: [
      { id: 'query', label: 'SQL', w: 'auto', cls: 'cell-sql' },
      { id: 'duration', label: '耗时', w: '90px', cls: 'cell-dur', sortable: true },
      { id: 'connection', label: '连接', w: '80px', cls: 'cell-mono' },
      { id: 'source', label: '来源', w: '200px', cls: 'cell-src' },
      { id: 'request', label: '请求', w: '160px', cls: 'cell-src' },
    ],
  },
  cache: {
    icon: 'cache', title: '缓存操作', filterPlaceholder: '搜索缓存键 / 连接…',
    cols: [
      { id: 'type', label: '操作', w: '80px', cls: null },
      { id: 'key', label: '键', w: 'auto', cls: 'cell-mono' },
      { id: 'value', label: '值', w: '200px', cls: 'cell-mono' },
      { id: 'duration', label: '耗时', w: '90px', cls: 'cell-dur', sortable: true },
      { id: 'connection', label: '存储', w: '80px', cls: 'cell-mono' },
      { id: 'request', label: '请求', w: '160px', cls: 'cell-src' },
    ],
  },
  redis: {
    icon: 'redis', title: 'Redis 命令', filterPlaceholder: '搜索命令 / 键…',
    cols: [
      { id: 'command', label: '命令', w: '90px', cls: 'cell-mono' },
      { id: 'key', label: '键', w: 'auto', cls: 'cell-mono' },
      { id: 'parameters', label: '参数', w: '260px', cls: 'cell-mono' },
      { id: 'duration', label: '耗时', w: '90px', cls: 'cell-dur', sortable: true },
      { id: 'connection', label: '连接', w: '80px', cls: 'cell-mono' },
      { id: 'request', label: '请求', w: '160px', cls: 'cell-src' },
    ],
  },
  log: {
    icon: 'log', title: '日志记录', filterPlaceholder: '搜索日志消息…',
    cols: [
      { id: 'level', label: '级别', w: '80px', cls: null },
      { id: 'message', label: '消息', w: 'auto', cls: 'cell-msg' },
      { id: 'time', label: '时间', w: '110px', cls: 'cell-mono' },
      { id: 'request', label: '请求', w: '160px', cls: 'cell-src' },
    ],
  },
  events: {
    icon: 'events', title: '事件派发', filterPlaceholder: '搜索事件名…',
    cols: [
      { id: 'event', label: '事件', w: '260px', cls: 'cell-mono' },
      { id: 'listeners', label: '监听器', w: '220px', cls: null },
      { id: 'duration', label: '耗时', w: '90px', cls: 'cell-dur', sortable: true },
      { id: 'time', label: '时间', w: '110px', cls: 'cell-mono' },
      { id: 'request', label: '请求', w: '160px', cls: 'cell-src' },
    ],
  },
  views: {
    icon: 'views', title: '视图渲染', filterPlaceholder: '搜索视图名…',
    cols: [
      { id: 'name', label: '视图', w: 'auto', cls: 'cell-mono' },
      { id: 'duration', label: '耗时', w: '90px', cls: 'cell-dur', sortable: true },
      { id: 'request', label: '请求', w: '160px', cls: 'cell-src' },
    ],
  },
  notifications: {
    icon: 'notifications', title: '通知 / 邮件', filterPlaceholder: '搜索主题 / 收件人…',
    cols: [
      { id: 'type', label: '类型', w: '80px', cls: 'cell-mono' },
      { id: 'subject', label: '主题', w: 'auto', cls: null },
      { id: 'to', label: '收件人', w: '180px', cls: 'cell-mono' },
      { id: 'duration', label: '耗时', w: '90px', cls: 'cell-dur', sortable: true },
      { id: 'time', label: '时间', w: '110px', cls: 'cell-mono' },
      { id: 'request', label: '请求', w: '160px', cls: 'cell-src' },
    ],
  },
}

const WINDOW_SECONDS = { '15m': 900, '1h': 3600, '24h': 86400, '7d': 604800 }

const FULL_FIELDS = new Set(['SQL', 'SQL 完整语句', '绑定值', '载荷', '内容', '调用栈', '上下文', '参数', '值', '消息'])

const fmt = (n) => Number(n || 0).toLocaleString()
// Real log/event/notification entries carry `time` as a unix float; format it to a clock.
const fmtTime = (unix) => {
  if (unix == null || unix === '') return '—'
  const d = new Date(Number(unix) * 1000)
  if (isNaN(d.getTime())) return String(unix)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
// Lowercase a search field safely — some fields are arrays/objects (e.g. notification `to`
// comes from messageAddressToString which returns an array), which would crash .toLowerCase().
const txt = (v) => String(v == null ? '' : v).toLowerCase()
// Safe division / percentage so empty categories (0 totals) render 0 instead of NaN.
const div = (a, b) => (b ? a / b : 0)
const pct = (a, b) => (b ? (a / b) * 100 : 0)
const f1 = (a, b) => div(a, b).toFixed(1)
const f0 = (a, b) => pct(a, b).toFixed(0)
const f1p = (a, b) => pct(a, b).toFixed(1)

function MiniBar({ kind, flex }) {
  return <span className={`kpi-mini-bar ${kind}`} style={{ flex }} />
}

/* ── Per-category KPI band (c is already normalizeKpi'd, so all fields are safe) ── */
function KpiBand({ cat, c, t }) {
  switch (cat) {
    case 'database': {
      const total = c.select + c.insert + c.update + c.delete + c.other
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总查询')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(total)}</div><span className="kpi-tag warn">{fmt(c.slow)} 慢</span></div>
            <div className="kpi-mini-bars">
              <MiniBar kind="select" flex={c.select} /><MiniBar kind="insert" flex={c.insert} />
              <MiniBar kind="update" flex={c.update} /><MiniBar kind="delete" flex={c.delete} /><MiniBar kind="other" flex={c.other} />
            </div>
            <div className="kpi-sub">SELECT {fmt(c.select)} · INSERT {fmt(c.insert)} · UPDATE {fmt(c.update)} · DELETE {fmt(c.delete)} · OTHER {fmt(c.other)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')} · {t('总耗时')} {(c.totalDuration / 1000).toFixed(1)}s</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {f1(total, c.requestCount)} 条查询</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('慢查询率')}</div>
            <div className="kpi-body"><div className="kpi-val">{f1p(c.slow, total)}%</div><span className={`kpi-tag ${c.slow > 20 ? 'danger' : 'warn'}`}>{fmt(c.slow)} 条</span></div>
            <div className="kpi-sub">{t('阈值')} &gt; 500ms · {t('需关注 N+1 查询')}</div>
          </div>
        </>
      )
    }
    case 'cache': {
      const total = c.hits + c.misses + c.writes + c.deletes
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总操作')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(total)}</div><span className="kpi-tag good">{f1p(c.hits, c.readTotal)}% {t('命中')}</span></div>
            <div className="kpi-mini-bars"><MiniBar kind="hit" flex={c.hits} /><MiniBar kind="miss" flex={c.misses} /><MiniBar kind="write" flex={c.writes} /><MiniBar kind="delete" flex={c.deletes} /></div>
            <div className="kpi-sub">HIT {fmt(c.hits)} · MISS {fmt(c.misses)} · WRITE {fmt(c.writes)} · DELETE {fmt(c.deletes)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('命中率')}</div>
            <div className="kpi-body"><div className="kpi-val">{f1p(c.hits, c.readTotal)}%</div></div>
            <div className="kpi-sub">{fmt(c.hits)} / {fmt(c.readTotal)} {t('次读取命中')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')} · {t('总耗时')} {(c.totalTime / 1000).toFixed(2)}s</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {f1(total, c.requestCount)} 次操作</div>
          </div>
        </>
      )
    }
    case 'redis': {
      const top = Object.entries(c.commands).sort((a, b) => b[1] - a[1]).slice(0, 4)
      const get = c.commands.GET || 0
      const setex = c.commands.SETEX || 0
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总命令')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.total)}</div></div>
            <div className="kpi-sub">{top.map(([k, v]) => `${k} ${fmt(v)}`).join(' · ') || '—'}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')} · {t('总耗时')} {(c.totalTime / 1000).toFixed(2)}s</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {f1(c.total, c.requestCount)} 条命令</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('GET 占比')}</div>
            <div className="kpi-body"><div className="kpi-val">{f0(get, c.total)}%</div></div>
            <div className="kpi-sub">{t('读密集型')} · SETEX {fmt(setex)} {t('次写入')}</div>
          </div>
        </>
      )
    }
    case 'log': {
      const critical = c.levels.critical || 0
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总日志')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.total)}</div><span className="kpi-tag danger">{fmt(c.error)} {t('错误')}</span></div>
            <div className="kpi-sub">WARNING {fmt(c.warning)} · NOTICE {fmt(c.notice)} · INFO {fmt(c.info)} · DEBUG {fmt(c.debug)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('错误 / 严重')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.error + critical)}</div></div>
            <div className="kpi-sub">critical {fmt(critical)} · error {fmt(c.error)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('DEBUG 占比')}</div>
            <div className="kpi-body"><div className="kpi-val">{f0(c.debug, c.total)}%</div></div>
            <div className="kpi-sub">{fmt(c.debug)} {t('条调试日志')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {f1(c.total, c.requestCount)} 条日志</div>
          </div>
        </>
      )
    }
    case 'events': {
      const top = Object.entries(c.topEvents).slice(0, 3)
      const topName = Object.keys(c.topEvents)[0]
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总事件')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.total)}</div></div>
            <div className="kpi-sub">{top.map(([k, v]) => `${k.split('\\').pop()}: ${fmt(v)}`).join(' · ') || '—'}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均派发耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {f1(c.total, c.requestCount)} {t('个事件')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('最多事件')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.topEvents[topName] || 0)}</div></div>
            <div className="kpi-sub">{topName ? topName.split('\\').pop() : '—'}</div>
          </div>
        </>
      )
    }
    case 'views': {
      const top = Object.entries(c.topViews).slice(0, 3)
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总渲染')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.total)}</div></div>
            <div className="kpi-sub">{top.map(([k, v]) => `${k}: ${fmt(v)}`).join(' · ') || '—'}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')} · {t('总耗时')} {(c.totalTime / 1000).toFixed(1)}s</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {f1(c.total, c.requestCount)} 次渲染</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('最慢视图')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.slowest}</div><span className="kpi-sub">ms</span></div>
            <div className="kpi-sub">{c.slowestName || '—'} · {fmt(c.slowestCount)} 次渲染</div>
          </div>
        </>
      )
    }
    case 'notifications': {
      const mail = c.types.mail || 0
      const total = c.total
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总通知')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.total)}</div></div>
            <div className="kpi-sub">MAIL {fmt(c.types.mail)} · SMS {fmt(c.types.sms)} · SLACK {fmt(c.types.slack)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')} · {t('总耗时')} {(c.totalTime / 1000).toFixed(1)}s</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('邮件占比')}</div>
            <div className="kpi-body"><div className="kpi-val">{f0(mail, total)}%</div></div>
            <div className="kpi-sub">{fmt(mail)} {t('封邮件')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {div(total, c.requestCount).toFixed(2)} {t('条通知')}</div>
          </div>
        </>
      )
    }
    default:
      return null
  }
}

/* ── Per-category detail fields ── */
function detailFields(cat, d, t, goRequest) {
  const req = () => <button className="req-link" onClick={(e) => { e.stopPropagation(); goRequest(d.requestId) }}>{d.requestUri}</button>
  switch (cat) {
    case 'database':
      return [
        [t('类型'), <span className={`cell-type-badge ${d.type}`}>{(d.type || '').toUpperCase()}</span>],
        [t('连接'), d.connection],
        [t('模型'), d.model || '—'],
        [t('耗时'), `${Number(d.duration || 0).toFixed(1)} ms`],
        [t('来源'), d.file],
        [t('请求'), req()],
        [t('绑定值'), <ExpandableCode text={JSON.stringify(d.bindings || {}, null, 2)} label={t('展开绑定值 ▼')} />],
        [t('SQL 完整语句'), <ExpandableCode text={d.query} />],
        [t('调用栈'), <ExpandableTrace trace={d.trace || null} />],
        [t('标签'), (d.tags || []).length ? d.tags.map(tg => <span key={tg} className={tg === 'slow' ? 'tag-slow' : 'tag-n1'}>{tg}</span>) : '—'],
      ]
    case 'cache':
      return [
        [t('类型'), <span className={`cache-type-badge ${d.type}`}>{(d.type || '').toUpperCase()}</span>],
        [t('键'), <code>{d.key}</code>],
        [t('值'), d.value ? <ExpandableCode text={d.value} /> : '—'],
        [t('耗时'), `${Number(d.duration || 0).toFixed(2)} ms`],
        [t('连接/存储'), d.connection],
        [t('过期时间'), d.expiration ? `${d.expiration}s` : '—'],
        [t('请求'), req()],
      ]
    case 'redis':
      return [
        [t('命令'), <code>{d.command}</code>],
        [t('键'), d.key || '—'],
        [t('参数'), <ExpandableCode text={JSON.stringify(d.parameters || [], null, 2)} />],
        [t('耗时'), `${Number(d.duration || 0).toFixed(2)} ms`],
        [t('连接'), d.connection],
        [t('请求'), req()],
      ]
    case 'log':
      return [
        [t('级别'), <span className={`level-badge ${d.level}`}>{(d.level || '').toUpperCase()}</span>],
        [t('消息'), d.message],
        [t('时间'), fmtTime(d.time)],
        [t('上下文'), d.context ? <ExpandableCode text={JSON.stringify(d.context, null, 2)} /> : '—'],
        [t('请求'), req()],
        [t('调用栈'), <ExpandableTrace trace={d.trace || null} />],
      ]
    case 'events':
      return [
        [t('事件'), <code>{d.event}</code>],
        [t('载荷'), <ExpandableCode text={JSON.stringify(d.data || {}, null, 2)} />],
        [t('监听器'), (d.listeners || []).length ? d.listeners.map((l, i) => <code key={i}>{l}</code>) : '—'],
        [t('耗时'), d.duration ? `${Number(d.duration).toFixed(2)} ms` : `— (${t('系统级事件不占耗时')})`],
        [t('时间'), fmtTime(d.time)],
        [t('请求'), req()],
      ]
    case 'views':
      return [
        [t('视图'), <code>{d.name}</code>],
        [t('耗时'), `${Number(d.duration || 0).toFixed(1)} ms`],
        [t('请求'), req()],
      ]
    case 'notifications':
      return [
        [t('类型'), <code>{d.type}</code>],
        [t('主题'), d.subject],
        [t('发件人'), d.from],
        [t('收件人'), d.to],
        [t('耗时'), `${Number(d.duration || 0).toFixed(1)} ms`],
        [t('时间'), fmtTime(d.time)],
        [t('内容'), <ExpandableCode text={d.content} />],
        [t('请求'), req()],
      ]
    default:
      return []
  }
}

export default function Operations() {
  const { t } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const currentCat = CATEGORY_ORDER.includes(params.get('category')) ? params.get('category') : 'database'

  const [timeWindow, setTimeWindow] = useState('24h')
  const [reqType, setReqType] = useState('all')
  const [filterSearch, setFilterSearch] = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('desc')
  const [expandedIdx, setExpandedIdx] = useState(null)
  const tbodyRef = useRef(null)
  const kpiRef = useRef(null)
  const scrollRef = useRef(null)
  // kpis/total describe the WHOLE matched window, not a page. They come from the first batch's
  // (offset 0) response and must persist across later offset fetches, so they live here in state
  // rather than inside usePagedList's accumulated items.
  const [kpis, setKpis] = useState(null)
  const [total, setTotal] = useState(0)

  const ui = CATEGORY_UI[currentCat]
  const goRequest = (requestId) => navigate(`/requests/${requestId}`)

  // Offset-paged fetch for /__clockwork/operations/{category}. sinceParam/typeParam are derived
  // from the three primitive filters below, so the callback only needs to depend on those.
  const fetch = useCallback(async (pageState, batchSize) => {
    const offset = pageState?.offset ?? 0
    const p = { offset, limit: batchSize }
    if (WINDOW_SECONDS[timeWindow]) p.since = Math.floor(Date.now() / 1000) - WINDOW_SECONDS[timeWindow]
    if (reqType !== 'all') p.type = reqType
    const d = await api.operations(currentCat, p)
    if (offset === 0) {
      setKpis(d?.kpis ? normalizeKpi(currentCat, d.kpis) : null)
      setTotal(d?.total ?? 0)
    }
    const items = d?.operations ?? []
    return { items, nextPageState: { offset: offset + items.length }, hasMore: offset + items.length < (d?.total ?? 0) }
  }, [currentCat, timeWindow, reqType])

  const { items, pending, loading, joining, phase, error, hasMore, reload, loadMore, sentinelRef, revealRegionRef } = usePagedList({ fetch, batchSize: 50, rootRef: scrollRef })

  // Reset paging from offset 0 when a primitive filter changes. The hook's own mount effect
  // already fires the initial batch (its `reload` is memoized on batchSize only, so depending on
  // [reload] would NOT refire on filter change — hence this primitive-keyed effect). The
  // firstRunRef skips the very first run to avoid a double initial fetch.
  const firstRunRef = useRef(true)
  useEffect(() => {
    if (firstRunRef.current) { firstRunRef.current = false; return }
    setExpandedIdx(null)
    reload()
  }, [currentCat, timeWindow, reqType, reload])

  // Search + column sort stay client-side over the already-loaded (paged) items.
  const rows = useMemo(() => {
    let r = (items || []).slice()
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase()
      r = r.filter(row => {
        switch (currentCat) {
          case 'database': return txt(row.query).includes(q) || txt(row.connection).includes(q) || txt(row.file).includes(q)
          case 'cache': return txt(row.key).includes(q) || txt(row.type).includes(q)
          case 'redis': return txt(row.command).includes(q) || txt(row.key).includes(q)
          case 'log': return txt(row.message).includes(q) || txt(row.level).includes(q)
          case 'events': return txt(row.event).includes(q)
          case 'views': return txt(row.name).includes(q)
          case 'notifications': return txt(row.subject).includes(q) || txt(row.to).includes(q)
          default: return true
        }
      })
    }
    if (sortCol) {
      r.sort((a, b) => {
        let va = a[sortCol], vb = b[sortCol]
        if (typeof va === 'string') va = va.toLowerCase()
        if (typeof vb === 'string') vb = vb.toLowerCase()
        if (va == null) va = 0
        if (vb == null) vb = 0
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
      })
    }
    return r
  }, [items, currentCat, filterSearch, sortCol, sortDir])

  const prevLenRef = useRef(0)
  // Entrance only on a fresh (re)load (0 → N). Appends (N → N+M) are animated by the reveal
  // slide-in, so we must not re-stagger the whole list on every append commit.
  useEffect(() => {
    const len = rows.length
    const fresh = len > 0 && prevLenRef.current === 0
    prevLenRef.current = len
    if (!fresh || !motionOk() || !tbodyRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('tr:not(.detail-row)', { opacity: 0, y: 6, duration: 0.2, stagger: 0.012, ease: 'power2.out', clearProps: 'all' })
    }, tbodyRef)
    return () => ctx.revert()
  }, [rows])

  useEffect(() => {
    if (!motionOk()) return
    const ctx = gsap.context(() => {
      gsap.from('.sidebar', { opacity: 0, x: -20, duration: 0.3, ease: 'power2.out' })
      gsap.from('.topbar', { opacity: 0, y: -8, duration: 0.25, ease: 'power2.out', delay: 0.06 })
      if (kpiRef.current) gsap.from(kpiRef.current.children, { opacity: 0, y: 10, duration: 0.25, stagger: 0.05, ease: 'power2.out', delay: 0.12, clearProps: 'all' })
    })
    return () => ctx.revert()
  }, [])

  const onSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
    setExpandedIdx(null)
  }

  const renderCell = (col, d) => {
    const val = d[col.id]
    if (currentCat === 'database' && col.id === 'source') {
      return <td className={col.cls} title={d.file}>{d.file || '—'}</td>
    }
    if (currentCat === 'database' && col.id === 'query') {
      const tags = (d.tags || []).map(tg => <span key={tg} className={tg === 'slow' ? 'tag-slow' : 'tag-n1'}>{tg}</span>)
      return <td className={col.cls} title={val}>{val}{tags}</td>
    }
    if (currentCat === 'database' && col.id === 'duration') {
      const n = parseFloat(val)
      const barCls = n < 10 ? 'fast' : n < 100 ? 'med' : 'slow'
      const slCls = n > 500 ? ' vslow' : n > 100 ? ' slow' : ''
      const barW = Math.max(Math.min(n / 20, 60), 4)
      return <td className={`cell-dur${slCls}`}><span className={`dur-bar ${barCls}`} style={{ width: barW }} />&nbsp;{n.toFixed(1)} ms</td>
    }
    if (currentCat === 'cache' && col.id === 'type') {
      return <td><span className={`cache-type-badge ${val}`}>{(val || '').toUpperCase()}</span></td>
    }
    if (currentCat === 'log' && col.id === 'level') {
      return <td><span className={`level-badge ${val}`}>{(val || '').toUpperCase()}</span></td>
    }
    if (currentCat === 'redis' && col.id === 'parameters') {
      return <td className={col.cls} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{JSON.stringify(val)}</td>
    }
    if (col.id === 'duration' && (currentCat === 'cache' || currentCat === 'redis')) {
      return <td className="cell-dur">{parseFloat(val).toFixed(2)} ms</td>
    }
    if (col.id === 'duration' && currentCat === 'events' && val == null) {
      return <td className="cell-dur" style={{ color: 'var(--muted)' }}>—</td>
    }
    if (col.id === 'listeners') {
      return <td style={{ fontSize: 12 }}>{(val || []).length ? val.map(l => l.split('\\').pop()).join(', ') : '—'}</td>
    }
    if (col.id === 'event') {
      return <td className={col.cls} style={{ fontSize: 11 }} title={val}>{(val || '').split('\\').pop() || val}</td>
    }
    if (col.id === 'time') {
      return <td className={col.cls}>{fmtTime(val)}</td>
    }
    return <td className={col.cls}>{val == null ? '—' : String(val)}</td>
  }

  const renderCellTd = (col, d) => {
    if (col.id === 'request') {
      return <td className={col.cls}><button className="req-link" onClick={(e) => { e.stopPropagation(); goRequest(d.requestId) }}>{d.requestUri}</button></td>
    }
    return renderCell(col, d)
  }

  return (
    <div className="operations-page">
      <Sidebar />

      <main className="main">
        <div className="topbar">
          <button className="back" title={t('返回总览')} onClick={() => navigate('/')}>←</button>
          <span className="topbar-icon"><Icon name={ui.icon} size={20} /></span>
          <h1>{t(ui.title)}</h1>
          <span className="spacer" />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t('记录窗口 7 天')}</span>
        </div>

        <div className="kpi-band" ref={kpiRef}>
          {loading && <div className="op-empty"><div className="empty-text">{t('加载中…')}</div></div>}
          {!loading && error && <div className="op-empty"><div className="empty-text">{t('加载失败')}：{error}</div></div>}
          {!loading && !error && kpis && <KpiBand cat={currentCat} c={kpis} t={t} />}
        </div>

        {!loading && !error && (
          <div className="filter-bar">
            <span className="flbl">{t('时间窗')}</span>
            <select value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)}>
              <option value="15m">{t('最近 15 分钟')}</option>
              <option value="1h">{t('最近 1 小时')}</option>
              <option value="24h">{t('最近 24 小时')}</option>
              <option value="7d">{t('最近 7 天')}</option>
            </select>
            <span className="flbl">{t('请求类型')}</span>
            <select value={reqType} onChange={(e) => setReqType(e.target.value)}>
              <option value="all">{t('全部')}</option>
              <option value="request">{t('请求')}</option>
              <option value="command">{t('命令')}</option>
              <option value="queue-job">{t('队列')}</option>
              <option value="test">{t('测试')}</option>
            </select>
            <span className="flbl">{currentCat === 'log' ? t('级别') : t('筛选')}</span>
            <input
              type="text"
              placeholder={t(ui.filterPlaceholder)}
              value={filterSearch}
              onChange={(e) => { setFilterSearch(e.target.value); setExpandedIdx(null) }}
              onKeyDown={(e) => { if (e.key === 'Escape') setFilterSearch('') }}
            />
            <span className="spacer" />
            <span className="summary">
              {t('共')} {rows.length} {t('条')}{t('（共')}{fmt(total)}{t('条')}{t('）')}
            </span>
          </div>
        )}

        <div className="table-wrap" ref={scrollRef}>
          <table className="op-table">
            <thead>
              <tr>
                {ui.cols.map(c => {
                  const arrow = sortCol === c.id ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''
                  return (
                    <th key={c.id} className={c.sortable ? 'sortable' : ''} style={{ width: c.w }} onClick={() => c.sortable && onSort(c.id)}>
                      {t(c.label)}{c.sortable && <span className="sort-arrow">{arrow}</span>}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {rows.length === 0 && !loading && (
                <tr><td colSpan={ui.cols.length}><div className="op-empty"><div className="empty-text">{t('无匹配结果')}</div></div></td></tr>
              )}
              {rows.flatMap((d, i) => {
                const isExp = expandedIdx === i
                const main = (
                  <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => setExpandedIdx(isExp ? null : i)}>
                    {ui.cols.map(col => <Fragment key={col.id}>{renderCellTd(col, d)}</Fragment>)}
                  </tr>
                )
                if (!isExp) return [main]
                const detail = (
                  <tr key={`d${i}`} className="detail-row">
                    <td colSpan={ui.cols.length}>
                      <div className="detail-panel">
                        <div className="detail-grid">
                          {detailFields(currentCat, d, t, goRequest).map(([k, v], idx) => (
                            <div key={idx} className={`detail-item${FULL_FIELDS.has(k) ? ' full' : ''}`}>
                              <span className="dk">{k}</span>
                              <span className="dv">{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="detail-actions">
                          <button className="btn" onClick={(e) => { e.stopPropagation(); setExpandedIdx(null) }}>{t('收起详情')}</button>
                          <button className="btn primary" onClick={(e) => { e.stopPropagation(); goRequest(d.requestId) }}>
                            <Icon name="search" size={12} /> {t('查看所属请求')}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
                return [main, detail]
              })}
            </tbody>
            {pending.length > 0 && (
              <tbody ref={revealRegionRef} className="pending-tbody">
                <tr className="pending-hint"><td colSpan={ui.cols.length}>{`${t('已加载')} ${pending.length} ${t('条 · 即将拼接')}`}</td></tr>
                {pending.flatMap((d, i) => (
                  <tr key={`p-${i}`} className="pending-row">
                    {ui.cols.map(col => <Fragment key={col.id}>{renderCellTd(col, d)}</Fragment>)}
                  </tr>
                ))}
              </tbody>
            )}
            <tbody className="footer-tbody">
              {loading && items.length > 0 && (
                <tr><td colSpan={ui.cols.length}><div className="op-empty"><div className="empty-text">{t('加载中…')}</div></div></td></tr>
              )}
              {hasMore && (
                <tr ref={sentinelRef}><td colSpan={ui.cols.length} />
                </tr>
              )}
              {!hasMore && items.length > 0 && (
                <tr><td colSpan={ui.cols.length}><div className="op-empty"><div className="empty-text">{t('没有更早的记录了')}</div></div></td></tr>
              )}
              {error && items.length > 0 && (
                <tr><td colSpan={ui.cols.length}><div className="op-empty"><div className="empty-text">{t('加载失败')}：{error} <button className="btn" onClick={loadMore}>{t('重试')}</button></div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
