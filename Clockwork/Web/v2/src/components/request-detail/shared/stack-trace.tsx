import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'

interface StackTraceProps {
  trace: any[]
  className?: string
  maxVisible?: number
}

interface StackFrame {
  file?: string
  line?: number
  class?: string
  function?: string
  type?: string
  args?: any[]
  [key: string]: unknown
}

function parseFrame(raw: any): StackFrame {
  if (typeof raw === 'string') {
    const match = raw.match(/^(.*?):(\d+)$/)
    if (match) return { file: match[1], line: parseInt(match[2], 10) }
    return { function: raw }
  }
  return raw as StackFrame
}

export function StackTrace({ trace, className, maxVisible = 5 }: StackTraceProps) {
  const [expanded, setExpanded] = useState(false)

  if (!trace || trace.length === 0) return null

  const frames = trace.map(parseFrame)
  const visibleFrames = expanded ? frames : frames.slice(0, maxVisible)
  const hasMore = frames.length > maxVisible

  return (
    <div className={cn('text-xs', className)}>
      {visibleFrames.map((frame, i) => (
        <div
          key={i}
          className="flex items-start gap-1.5 py-0.5 font-mono text-muted-foreground"
        >
          <FileText className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/60" />
          <span className="break-all">
            {frame.file ? (
              <>
                {frame.file}
                {frame.line != null && (
                  <span className="text-foreground">:{frame.line}</span>
                )}
              </>
            ) : frame.class ? (
              <>
                {frame.class}
                {frame.type}
                {frame.function}
              </>
            ) : (
              frame.function ?? JSON.stringify(frame)
            )}
          </span>
        </div>
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 inline-flex items-center gap-1 text-primary hover:underline"
        >
          {expanded ? (
            <>
              <ChevronDown className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronRight className="h-3 w-3" />
              Show {frames.length - maxVisible} more frames
            </>
          )}
        </button>
      )}
    </div>
  )
}
