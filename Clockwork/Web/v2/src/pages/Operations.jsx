import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { gsap, motionOk } from '../lib/motion.js'
import Sidebar from '../components/Sidebar.jsx'
import Icon from '../components/Icon.jsx'
import { ExpandableCode, ExpandableTrace } from '../components/ExpandableCode.jsx'
import { CATEGORIES, CATEGORY_ORDER } from '../data/operations.js'
import './operations.css'

const FULL_FIELDS = new Set(['SQL', 'SQL 完整语句', '绑定值', '载荷', '内容', '调用栈', '上下文', '参数', '值', '消息'])

function MiniBar({ kind, flex }) {
  return <span className={`kpi-mini-bar ${kind}`} style={{ flex }} />
}

function fmt(n) {
  return Number(n).toLocaleString()
}

/* ── Per-category KPI band ── */
function KpiBand({ cat, c, t }) {
  switch (cat) {
    case 'database': {
      const total = c.select + c.insert + c.update + c.delete + c.other
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总查询')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(total)}</div><span className="kpi-tag warn">{c.slow} 慢</span></div>
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
            <div className="kpi-sub">{t('平均每请求')} {(total / c.requestCount).toFixed(1)} 条查询</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('慢查询率')}</div>
            <div className="kpi-body"><div className="kpi-val">{(c.slow / total * 100).toFixed(1)}%</div><span className={`kpi-tag ${c.slow > 20 ? 'danger' : 'warn'}`}>{c.slow} 条</span></div>
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
            <div className="kpi-body"><div className="kpi-val">{fmt(total)}</div><span className="kpi-tag good">{c.hitRate.toFixed(1)}% 命中</span></div>
            <div className="kpi-mini-bars"><MiniBar kind="hit" flex={c.hits} /><MiniBar kind="miss" flex={c.misses} /><MiniBar kind="write" flex={c.writes} /><MiniBar kind="delete" flex={c.deletes} /></div>
            <div className="kpi-sub">HIT {fmt(c.hits)} · MISS {fmt(c.misses)} · WRITE {fmt(c.writes)} · DELETE {fmt(c.deletes)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('命中率')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.hitRate.toFixed(1)}%</div></div>
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
            <div className="kpi-sub">{t('平均每请求')} {(total / c.requestCount).toFixed(1)} 次操作</div>
          </div>
        </>
      )
    }
    case 'redis': {
      const top = Object.entries(c.commands).sort((a, b) => b[1] - a[1]).slice(0, 4)
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总命令')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.total)}</div></div>
            <div className="kpi-sub">{top.map(([k, v]) => `${k} ${fmt(v)}`).join(' · ')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')} · {t('总耗时')} {(c.totalTime / 1000).toFixed(2)}s</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {(c.total / c.requestCount).toFixed(1)} 条命令</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('GET 占比')}</div>
            <div className="kpi-body"><div className="kpi-val">{(c.commands.GET / c.total * 100).toFixed(0)}%</div></div>
            <div className="kpi-sub">{t('读密集型')} · SETEX {fmt(c.commands.SETEX)} {t('次写入')}</div>
          </div>
        </>
      )
    }
    case 'log':
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总日志')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.total)}</div><span className="kpi-tag danger">{c.error} 错误</span></div>
            <div className="kpi-sub">WARNING {fmt(c.warning)} · NOTICE {fmt(c.notice)} · INFO {fmt(c.info)} · DEBUG {fmt(c.debug)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('错误 / 严重')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.error + c.levels.critical}</div></div>
            <div className="kpi-sub">critical {c.levels.critical} · error {c.error}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('DEBUG 占比')}</div>
            <div className="kpi-body"><div className="kpi-val">{(c.debug / c.total * 100).toFixed(0)}%</div></div>
            <div className="kpi-sub">{fmt(c.debug)} {t('条调试日志')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {(c.total / c.requestCount).toFixed(1)} 条日志</div>
          </div>
        </>
      )
    case 'events': {
      const top = Object.entries(c.topEvents).slice(0, 3)
      return (
        <>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('总事件')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.total)}</div></div>
            <div className="kpi-sub">{top.map(([k, v]) => `${k.split('\\').pop()}: ${fmt(v)}`).join(' · ')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均派发耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {(c.total / c.requestCount).toFixed(1)} {t('个事件')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('最多事件')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(Object.values(c.topEvents)[0])}</div></div>
            <div className="kpi-sub">eloquent.retrieved</div>
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
            <div className="kpi-sub">{top.map(([k, v]) => `${k}: ${fmt(v)}`).join(' · ')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均耗时')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.avgDuration}</div></div>
            <div className="kpi-sub">{t('单位 ms')} · {t('总耗时')} {(c.totalTime / 1000).toFixed(1)}s</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {(c.total / c.requestCount).toFixed(1)} 次渲染</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('最慢视图')}</div>
            <div className="kpi-body"><div className="kpi-val">{c.slowest}</div><span className="kpi-sub">ms</span></div>
            <div className="kpi-sub">{c.slowestName} · {fmt(c.slowestCount)} 次渲染</div>
          </div>
        </>
      )
    }
    case 'notifications':
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
            <div className="kpi-body"><div className="kpi-val">{(c.types.mail / c.total * 100).toFixed(0)}%</div></div>
            <div className="kpi-sub">{fmt(c.types.mail)} {t('封邮件')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('涉及请求')}</div>
            <div className="kpi-body"><div className="kpi-val">{fmt(c.requestCount)}</div></div>
            <div className="kpi-sub">{t('平均每请求')} {(c.total / c.requestCount).toFixed(2)} {t('条通知')}</div>
          </div>
        </>
      )
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
        [t('耗时'), `${d.duration.toFixed(1)} ms`],
        [t('来源'), d.file],
        [t('请求'), req()],
        [t('绑定值'), <ExpandableCode text={JSON.stringify(d.bindings || {}, null, 2)} label={t('展开绑定值 ▼')} />],
        [t('SQL 完整语句'), <ExpandableCode text={d.query} />],
        [t('调用栈'), <ExpandableTrace trace={d.trace || null} />],
        [t('标签'), (d.tags || []).length ? d.tags.map(tg => <span key={tg} className={tg === 'slow' ? 'tag-slow' : 'tag-n1'}>{tg}</span>) : '—'],
      ]
    case 'cache':
      return [
        [t('类型'), <span className={`cache-type-badge ${d.type}`}>{d.type.toUpperCase()}</span>],
        [t('键'), <code>{d.key}</code>],
        [t('值'), d.value ? <ExpandableCode text={d.value} /> : '—'],
        [t('耗时'), `${d.duration.toFixed(2)} ms`],
        [t('连接/存储'), d.connection],
        [t('过期时间'), d.expiration ? `${d.expiration}s` : '—'],
        [t('请求'), req()],
      ]
    case 'redis':
      return [
        [t('命令'), <code>{d.command}</code>],
        [t('键'), d.key || '—'],
        [t('参数'), <ExpandableCode text={JSON.stringify(d.parameters || [], null, 2)} />],
        [t('耗时'), `${d.duration.toFixed(2)} ms`],
        [t('连接'), d.connection],
        [t('请求'), req()],
      ]
    case 'log':
      return [
        [t('级别'), <span className={`level-badge ${d.level}`}>{d.level.toUpperCase()}</span>],
        [t('消息'), d.message],
        [t('时间'), d.time],
        [t('上下文'), d.context ? <ExpandableCode text={JSON.stringify(d.context, null, 2)} /> : '—'],
        [t('请求'), req()],
        [t('调用栈'), <ExpandableTrace trace={d.trace || null} />],
      ]
    case 'events':
      return [
        [t('事件'), <code>{d.event}</code>],
        [t('载荷'), <ExpandableCode text={JSON.stringify(d.data || {}, null, 2)} />],
        [t('监听器'), (d.listeners || []).length ? d.listeners.map((l, i) => <code key={i}>{l}</code>) : '—'],
        [t('耗时'), d.duration ? `${d.duration.toFixed(2)} ms` : `— (${t('系统级事件不占耗时')})`],
        [t('时间'), d.time],
        [t('请求'), req()],
      ]
    case 'views':
      return [
        [t('视图'), <code>{d.name}</code>],
        [t('耗时'), `${d.duration.toFixed(1)} ms`],
        [t('开始'), new Date(d.start * 1000).toISOString().slice(11, 23)],
        [t('结束'), new Date(d.end * 1000).toISOString().slice(11, 23)],
        [t('请求'), req()],
      ]
    case 'notifications':
      return [
        [t('类型'), <code>{d.type}</code>],
        [t('主题'), d.subject],
        [t('发件人'), d.from],
        [t('收件人'), d.to],
        [t('耗时'), `${d.duration.toFixed(1)} ms`],
        [t('时间'), d.time],
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
  const [params, setParams] = useSearchParams()
  const currentCat = CATEGORY_ORDER.includes(params.get('category')) ? params.get('category') : 'database'

  const [filterSearch, setFilterSearch] = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortDir, setSortDir] = useState('desc')
  const [expandedIdx, setExpandedIdx] = useState(null)
  const tbodyRef = useRef(null)
  const kpiRef = useRef(null)

  const cat = CATEGORIES[currentCat]

  const goRequest = (requestId) => navigate(`/requests/${requestId}`)

  const changeCategory = (key) => {
    setParams(key === 'database' ? {} : { category: key }, { replace: true })
    setFilterSearch('')
    setSortCol(null)
    setExpandedIdx(null)
  }

  const rows = useMemo(() => {
    let r = cat.data.slice()
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase()
      r = r.filter(row => {
        switch (currentCat) {
          case 'database': return (row.query || '').toLowerCase().includes(q) || (row.connection || '').toLowerCase().includes(q) || (row.file || '').toLowerCase().includes(q)
          case 'cache': return (row.key || '').toLowerCase().includes(q) || (row.type || '').toLowerCase().includes(q)
          case 'redis': return (row.command || '').toLowerCase().includes(q) || (row.key || '').toLowerCase().includes(q)
          case 'log': return (row.message || '').toLowerCase().includes(q) || (row.level || '').toLowerCase().includes(q)
          case 'events': return (row.event || '').toLowerCase().includes(q)
          case 'views': return (row.name || '').toLowerCase().includes(q)
          case 'notifications': return (row.subject || '').toLowerCase().includes(q) || (row.to || '').toLowerCase().includes(q)
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
  }, [cat, currentCat, filterSearch, sortCol, sortDir])

  // Stagger rows on data/category change.
  useEffect(() => {
    if (!motionOk() || !tbodyRef.current) return
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
      gsap.from(kpiRef.current ? kpiRef.current.children : [], { opacity: 0, y: 10, duration: 0.25, stagger: 0.05, ease: 'power2.out', delay: 0.12, clearProps: 'all' })
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
    if (col.id === 'request') {
      return <button className="req-link" onClick={(e) => { e.stopPropagation(); goRequest(d.requestId) }}>{d.requestUri}</button>
    }
    if (currentCat === 'database' && col.id === 'source') {
      // Prototype keyed this column "source" but the data field is "file"; show the file:line.
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
      return <td><span className={`cache-type-badge ${val}`}>{val.toUpperCase()}</span></td>
    }
    if (currentCat === 'log' && col.id === 'level') {
      return <td><span className={`level-badge ${val}`}>{val.toUpperCase()}</span></td>
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
      return <td className={col.cls} style={{ fontSize: 11 }} title={val}>{val.split('\\').pop() || val}</td>
    }
    return <td className={col.cls}>{val == null ? '—' : String(val)}</td>
  }

  // The request column has no td wrapper above (returns a button directly); wrap it.
  const renderCellTd = (col, d) => {
    if (col.id === 'request') {
      return <td className={col.cls}><button className="req-link" onClick={(e) => { e.stopPropagation(); goRequest(d.requestId) }}>{d.requestUri}</button></td>
    }
    return renderCell(col, d)
  }

  return (
    <div className="operations-page">
      <Sidebar variant="operations" />

      <main className="main">
        <div className="topbar">
          <button className="back" title={t('返回总览')} onClick={() => navigate('/')}>←</button>
          <span className="topbar-icon"><Icon name={cat.icon} size={20} /></span>
          <h1>{t(cat.title)}</h1>
          <span className="spacer" />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t('记录窗口 7 天')} · {t('统计截止')} 2026-06-20 14:32</span>
        </div>

        <div className="kpi-band" ref={kpiRef}>
          <KpiBand cat={currentCat} c={cat.kpi} t={t} />
        </div>

        <div className="filter-bar">
          <span className="flbl">{t('时间窗')}</span>
          <select defaultValue="24h">
            <option value="15m">{t('最近 15 分钟')}</option>
            <option value="1h">{t('最近 1 小时')}</option>
            <option value="24h">{t('最近 24 小时')}</option>
            <option value="7d">{t('最近 7 天')}</option>
          </select>
          <span className="flbl">{t('请求类型')}</span>
          <select defaultValue="all">
            <option value="all">{t('全部')}</option>
            <option value="request">{t('请求')}</option>
            <option value="command">{t('命令')}</option>
            <option value="queue-job">{t('队列')}</option>
            <option value="test">{t('测试')}</option>
          </select>
          <span className="flbl">{currentCat === 'log' ? t('级别') : t('筛选')}</span>
          <input
            type="text"
            placeholder={t(cat.filterPlaceholder)}
            value={filterSearch}
            onChange={(e) => { setFilterSearch(e.target.value); setExpandedIdx(null) }}
            onKeyDown={(e) => { if (e.key === 'Escape') setFilterSearch('') }}
          />
          <span className="spacer" />
          <span className="summary">{t('共')} {rows.length} {t('条')}{t('（共')}{cat.data.length}{t('条')}{t('）')}</span>
        </div>

        <div className="table-wrap">
          <table className="op-table">
            <thead>
              <tr>
                {cat.cols.map(c => {
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
              {rows.length === 0 && (
                <tr><td colSpan={cat.cols.length}><div className="op-empty"><div className="empty-text">{t('无匹配结果')}</div></div></td></tr>
              )}
              {rows.flatMap((d, i) => {
                const isExp = expandedIdx === i
                const main = (
                  <tr key={`r${i}`} className={isExp ? 'expanded' : ''} onClick={() => setExpandedIdx(isExp ? null : i)}>
                    {cat.cols.map(col => renderCellTd(col, d))}
                  </tr>
                )
                if (!isExp) return [main]
                const detail = (
                  <tr key={`d${i}`} className="detail-row">
                    <td colSpan={cat.cols.length}>
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
          </table>
        </div>
      </main>
    </div>
  )
}
