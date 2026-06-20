import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { gsap, motionOk } from '../lib/motion.js'
import { durStr } from '../lib/format.js'
import BrandMark from '../components/BrandMark.jsx'
import UtilToggles from '../components/UtilToggles.jsx'
import { MethodBadge, StatusBadge, TypeBadge } from '../components/Badges.jsx'
import { RECENT, STATUS } from '../data/overview.js'
import './overview.css'

export default function Overview() {
  const { t } = useApp()
  const navigate = useNavigate()
  const rootRef = useRef(null)

  useEffect(() => {
    if (!motionOk()) return
    const ctx = gsap.context(() => {
      gsap.from('.status-bar', { opacity: 0, y: 8, duration: 0.25, ease: 'power2.out' })
      gsap.from('.kpi-row.overview .kpi-card', { opacity: 0, y: 12, duration: 0.28, stagger: 0.06, ease: 'power2.out', delay: 0.08, clearProps: 'all' })
      gsap.from('.section-hd', { opacity: 0, x: -6, duration: 0.22, stagger: 0.06, ease: 'power2.out', delay: 0.25, clearProps: 'all' })
      gsap.from('.recent-table tbody tr', { opacity: 0, x: -8, duration: 0.24, stagger: 0.04, ease: 'power2.out', delay: 0.3, clearProps: 'opacity,transform' })
    }, rootRef)
    return () => ctx.revert()
  }, [])

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
        <section className="status-bar">
          <div className="status-dot" />
          <span className="status-label">{t('收集器运行中')}</span>
          <div className="status-meta">
            <span>{t('速率')} <b>{STATUS.rate}</b></span><span className="sep">|</span>
            <span>{t('存储')} <b>{STATUS.storage}</b></span><span className="sep">|</span>
            <span>{t('最后收集')} <b>{STATUS.lastCollectedSeconds} {t('秒前')}</b></span>
          </div>
        </section>

        <div className="kpi-row overview">
          <div className="kpi-card">
            <div className="kpi-lbl">{t('请求总数')}</div>
            <div className="kpi-body">
              <div className="kpi-val">1,247</div>
              <span className="kpi-trend up">▲ 12%</span>
            </div>
            <div className="kpi-sub">{t('较昨日')} +134</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('失败请求')}</div>
            <div className="kpi-body">
              <div className="kpi-val">23</div>
              <span className="kpi-trend warn">▸ 3%</span>
            </div>
            <div className="kpi-sub">{t('错误率')} 1.8%</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('平均耗时')}</div>
            <div className="kpi-body">
              <div className="kpi-val">87</div>
              <span className="kpi-trend down">▼ 8%</span>
            </div>
            <div className="kpi-sub">{t('单位 ms')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-lbl">{t('数据库查询')}</div>
            <div className="kpi-body">
              <div className="kpi-val">5.8k</div>
              <span className="kpi-trend up">▲ 6%</span>
            </div>
            <div className="kpi-sub">{t('慢查询')} 31 {t('条')}</div>
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
              {RECENT.map((r, i) => {
                const slow = r.type === 'request' && r.duration > 300
                const isCmd = r.type === 'command'
                return (
                  <tr
                    key={i}
                    tabIndex={0}
                    role="link"
                    onClick={() => navigate('/requests')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/requests') } }}
                  >
                    <td><MethodBadge method={r.method} /></td>
                    <td className="uri-col">{r.uri}</td>
                    <td><TypeBadge type={r.type} /></td>
                    <td>{isCmd ? <StatusBadge status={r.status} exit /> : <StatusBadge status={r.status} />}</td>
                    <td className={slow ? 'p--slow' : ''}>{durStr(r.duration)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <a href="/requests" onClick={(e) => { e.preventDefault(); navigate('/requests') }}>
            {t('查看全部')} 1,247 {t('条请求 →')}
          </a>
        </div>
      </main>

      <footer className="overview-footer">
        Clockwork 5.x · {t('数据保留周期 7 天 · 支持 HTTP 请求 / Artisan 命令 / 队列任务 / 测试')}
      </footer>
    </div>
  )
}
