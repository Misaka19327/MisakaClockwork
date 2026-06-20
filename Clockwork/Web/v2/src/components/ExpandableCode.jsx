import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

const PREVIEW_LEN = 200

// Collapsible mono code block: truncated preview + "expand" toggle when long.
export function ExpandableCode({ text, label, maxLength = PREVIEW_LEN }) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)
  const s = String(text == null ? '' : text)
  const toggleLabel = label || t('展开全部 ▼')

  if (s.length <= maxLength) {
    return (
      <div className="code-block">
        <div className="code-preview">{s}</div>
      </div>
    )
  }

  return (
    <div className={`code-block ${open ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="code-preview has-more">{s.slice(0, maxLength)}…</div>
      <div className="code-full">{s}</div>
      <button
        type="button"
        className="code-toggle"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
      >
        {open ? t('收起 ▲') : toggleLabel}
      </button>
    </div>
  )
}

// Collapsible stack-trace frame list.
export function ExpandableTrace({ trace }) {
  const { t } = useApp()
  const [open, setOpen] = useState(false)

  if (!trace || !trace.length) return <>—</>

  const frame = (f, i, first = false) => (
    <div key={i} className={`trace-frame ${first ? 'tf-first' : ''}`}>
      <span className="tf-num">#{i}</span>
      <span className="tf-loc">{f.file || '?'}:{f.line || '?'}</span>
      {f.call && <span className="tf-call">{f.call}</span>}
    </div>
  )

  if (trace.length === 1) {
    return <div className="trace-list">{frame(trace[0], 0, true)}</div>
  }

  return (
    <div className={`code-block ${open ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
      <div className="code-preview has-more">
        <div className="trace-list">{frame(trace[0], 0, true)}</div>
      </div>
      <div className="code-full">
        <div className="trace-list">{trace.map((f, i) => frame(f, i, i === 0))}</div>
      </div>
      <button
        type="button"
        className="code-toggle"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
      >
        {open ? t('收起 ▲') : `${t('展开全部')}${trace.length - 1} ${t('帧 ▼')}`}
      </button>
    </div>
  )
}
