import { useState, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/utils/format'
import type { TimelineEvent } from '@/types/clockwork'

interface TimelineChartProps {
  events: TimelineEvent[]
  className?: string
  minDuration?: number
}

interface Viewport {
  start: number
  end: number
}

export function TimelineChart({ events, className, minDuration = 0 }: TimelineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; viewport: Viewport } | null>(null)

  const filtered = useMemo(
    () => (minDuration > 0 ? events.filter((e) => e.duration >= minDuration) : events),
    [events, minDuration],
  )

  const totalStart = useMemo(() => {
    if (filtered.length === 0) return 0
    return Math.min(...filtered.map((e) => e.start))
  }, [filtered])

  const totalEnd = useMemo(() => {
    if (filtered.length === 0) return 1
    return Math.max(...filtered.map((e) => e.end))
  }, [filtered])

  const totalDuration = totalEnd - totalStart
  const activeViewport = viewport ?? { start: totalStart, end: totalEnd }
  const viewDuration = activeViewport.end - activeViewport.start

  const toPercent = useCallback(
    (time: number) => {
      return ((time - activeViewport.start) / viewDuration) * 100
    },
    [activeViewport, viewDuration],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      setDragStart({ x, viewport: { ...activeViewport } })
    },
    [activeViewport],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragStart || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const delta = x - dragStart.x
      const shift = delta * viewDuration

      setViewport({
        start: dragStart.viewport.start + shift,
        end: dragStart.viewport.end + shift,
      })
    },
    [dragStart, viewDuration],
  )

  const handleMouseUp = useCallback(() => {
    setDragStart(null)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!containerRef.current) return
      e.preventDefault()
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const point = activeViewport.start + x * viewDuration
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9

      const newDuration = viewDuration * zoomFactor
      const ratio = (point - activeViewport.start) / viewDuration

      const newStart = point - ratio * newDuration
      const newEnd = point + (1 - ratio) * newDuration

      setViewport({ start: newStart, end: newEnd })
    },
    [activeViewport, viewDuration],
  )

  const resetZoom = useCallback(() => {
    setViewport(null)
  }, [])

  const defaultColors = [
    'bg-blue-400 dark:bg-blue-500',
    'bg-emerald-400 dark:bg-emerald-500',
    'bg-amber-400 dark:bg-amber-500',
    'bg-purple-400 dark:bg-purple-500',
    'bg-pink-400 dark:bg-pink-500',
    'bg-cyan-400 dark:bg-cyan-500',
    'bg-orange-400 dark:bg-orange-500',
    'bg-indigo-400 dark:bg-indigo-500',
  ]

  if (filtered.length === 0) {
    return (
      <div className={cn('py-8 text-center text-sm text-muted-foreground', className)}>
        No timeline events
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDuration(activeViewport.start - totalStart)} elapsed</span>
        <div className="flex items-center gap-2">
          {viewport && (
            <button
              type="button"
              onClick={resetZoom}
              className="text-primary hover:underline"
            >
              Reset zoom
            </button>
          )}
          <span>Total: {formatDuration(totalDuration)}</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative h-auto select-none overflow-hidden rounded border border-border bg-card"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: dragStart ? 'grabbing' : 'grab' }}
      >
        <div className="flex flex-col gap-0.5 p-2">
          {filtered.map((event, i) => {
            const left = Math.max(0, toPercent(event.start))
            const right = Math.min(100, toPercent(event.end))
            const width = Math.max(0.5, right - left)
            const colorClass = event.color
              ? ''
              : defaultColors[i % defaultColors.length]

            return (
              <div
                key={i}
                className="group relative flex h-6 items-center"
              >
                <div
                  className={cn(
                    'absolute h-5 rounded-sm transition-opacity group-hover:opacity-90',
                    colorClass,
                  )}
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    ...(event.color ? { backgroundColor: event.color } : {}),
                    minWidth: '2px',
                  }}
                />
                <div
                  className="absolute left-0 top-full z-10 hidden rounded bg-popover px-2 py-1 text-xs shadow-lg group-hover:block"
                  style={{ left: `${Math.min(left, 80)}%` }}
                >
                  <div className="font-medium text-popover-foreground">{event.description}</div>
                  <div className="text-muted-foreground">
                    {formatDuration(event.duration)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
