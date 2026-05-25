import { useCallback, useRef, useState, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SplitViewProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  expanded: boolean
}

const COMPACT_DEFAULT_WIDTH = 320
const MIN_LEFT_WIDTH = 280
const MAX_LEFT_WIDTH = 500
const BREAKPOINT = 900

export function SplitView({
  leftPanel,
  rightPanel,
  expanded,
}: SplitViewProps) {
  const [leftWidth, setLeftWidth] = useState(COMPACT_DEFAULT_WIDTH)
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < BREAKPOINT,
  )
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const nextWidthRef = useRef<number>(leftWidth)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || expanded) return
      e.preventDefault()
      isDragging.current = true

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return
        const newWidth = Math.min(
          MAX_LEFT_WIDTH,
          Math.max(MIN_LEFT_WIDTH, moveEvent.clientX),
        )
        nextWidthRef.current = newWidth
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          setLeftWidth(nextWidthRef.current)
        })
      }

      const handleMouseUp = () => {
        isDragging.current = false
        cancelAnimationFrame(rafRef.current)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [isMobile, expanded],
  )

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div
          className={cn(
            'border-b border-border overflow-hidden transition-[height] duration-200',
            expanded ? 'h-full' : 'h-2/5',
          )}
        >
          {leftPanel}
        </div>
        {!expanded && (
          <div className="flex-1 overflow-hidden">{rightPanel}</div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left panel */}
      <div
        className={cn(
          'shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out',
        )}
        style={{ width: expanded ? '100%' : leftWidth }}
      >
        {leftPanel}
      </div>

      {/* Divider */}
      {!expanded && (
        <div
          className={cn(
            'shrink-0 w-[1px] bg-border cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors relative group',
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {/* Right panel */}
      {!expanded && (
        <div className="flex-1 overflow-hidden">{rightPanel}</div>
      )}
    </div>
  )
}
