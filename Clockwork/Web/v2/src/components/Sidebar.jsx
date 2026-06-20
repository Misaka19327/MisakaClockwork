import { Link, useSearchParams } from 'react-router-dom'
import BrandMark from './BrandMark.jsx'
import Icon from './Icon.jsx'
import UtilToggles from './UtilToggles.jsx'
import { useApp } from '../context/AppContext.jsx'
import { CATEGORY_ORDER, CATEGORIES, NAV_COUNTS } from '../data/operations.js'

const REQ_BADGE = '1,247'
const FAILED_BADGE = '23'

function CategoryLinks({ active }) {
  const { t } = useApp()
  const [params] = useSearchParams()
  const activeCat = params.get('category') || 'database'
  return CATEGORY_ORDER.map((key) => {
    const cat = CATEGORIES[key]
    const isActive = active === 'operations' && key === activeCat
    return (
      <Link
        key={key}
        to={`/operations?category=${key}`}
        id={`nav-${key}`}
        className={isActive ? 'active' : ''}
      >
        <Icon name={cat.icon} size={14} />
        <span>{t(cat.name)}</span>
        <span className="nav-badge">{NAV_COUNTS[key]}</span>
      </Link>
    )
  })
}

// variant: 'list' | 'detail' | 'operations'
export default function Sidebar({ variant = 'list' }) {
  const { t } = useApp()

  const footerText = variant === 'detail'
    ? t('查看详情')
    : variant === 'operations'
      ? t('记录窗口 7 天')
      : `${t('收集')} 1,247 ${t('条请求')}`

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link to="/" aria-label={t('回到主页')}>
          <BrandMark size={28} />
          <span>{t('Clockwork')}</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {variant === 'operations' && (
          <>
            <Link to="/"><Icon name="grid" size={14} /> <span>{t('总览')}</span></Link>
            <Link to="/requests"><Icon name="list" size={14} /> <span>{t('请求列表')}</span> <span className="nav-badge">{REQ_BADGE}</span></Link>
            <div className="nav-section">{t('操作中心')}</div>
            <CategoryLinks active="operations" />
          </>
        )}

        {variant === 'list' && (
          <>
            <Link to="/requests" className="active"><Icon name="list" size={14} /> <span>{t('请求列表')}</span> <span className="nav-badge">{REQ_BADGE}</span></Link>
            <Link to="/requests?type=failed"><Icon name="warning" size={14} /> <span>{t('失败请求')}</span> <span className="nav-badge">{FAILED_BADGE}</span></Link>
            <CategoryLinks active="list" />
          </>
        )}

        {variant === 'detail' && (
          <>
            <Link to="/requests"><Icon name="list" size={14} /> <span>{t('请求列表')}</span></Link>
            <Link to="." className="active-side"><Icon name="search" size={14} /> <span>{t('请求详情')}</span></Link>
            <Link to="/requests?type=failed"><Icon name="warning" size={14} /> <span>{t('失败请求')}</span></Link>
            <CategoryLinks active="detail" />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div>
          <span className="dot" />
          {t('已连接')} — {footerText}
        </div>
        <div className="util-toggles" style={{ marginTop: 8 }}>
          <UtilToggles />
        </div>
      </div>
    </aside>
  )
}
