import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface KeyValueTableProps {
  data: Record<string, unknown>
  className?: string
  maxPreviewLength?: number
}

export function KeyValueTable({
  data,
  className,
  maxPreviewLength = 80,
}: KeyValueTableProps) {
  const entries = Object.entries(data)

  if (entries.length === 0) {
    return <div className="px-3 py-6 text-center text-sm text-muted-foreground">No data</div>
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="px-3 py-2 font-medium text-muted-foreground">Key</th>
            <th className="px-3 py-2 font-medium text-muted-foreground">Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <KeyValueRow key={key} keyName={key} value={value} maxPreviewLength={maxPreviewLength} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KeyValueRow({
  keyName,
  value,
  maxPreviewLength,
  depth = 0,
}: {
  keyName: string
  value: unknown
  maxPreviewLength: number
  depth?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const isExpandable = typeof value === 'object' && value !== null
  const stringValue = isExpandable
    ? JSON.stringify(value, null, 2)
    : String(value ?? '')

  const preview =
    !expanded && stringValue.length > maxPreviewLength
      ? stringValue.slice(0, maxPreviewLength) + '...'
      : stringValue

  return (
    <>
      <tr className="border-b border-border/50 last:border-0">
        <td className="px-3 py-1.5 font-mono text-xs font-medium text-foreground" style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}>
          {isExpandable ? (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-0.5 hover:text-primary"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {keyName}
            </button>
          ) : (
            keyName
          )}
        </td>
        <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
          {isExpandable && !expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-left hover:text-primary"
            >
              {preview}
            </button>
          ) : isExpandable && expanded ? (
            <pre className="whitespace-pre-wrap break-all text-xs">{preview}</pre>
          ) : (
            <span className="break-all">{preview}</span>
          )}
        </td>
      </tr>
      {isExpandable &&
        expanded &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <KeyValueRow
            key={`${keyName}.${k}`}
            keyName={k}
            value={v}
            maxPreviewLength={maxPreviewLength}
            depth={depth + 1}
          />
        ))}
    </>
  )
}
