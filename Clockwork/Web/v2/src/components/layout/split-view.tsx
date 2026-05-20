import { useCallback, useRef, useState, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SplitViewProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  collapsed: boolean
  onToggleCollapse: () => void
}

const DEFAULT_LEFT_WIDTH = 320
const MIN_LEFT_WIDTH = 200
const MAX_LEFT_WIDTH = 600
const BREAKPOINT = 900

export function SplitView({
  leftPanel,
  rightPanel,
  collapsed,
  onToggleCollapse,
}: SplitViewProps) {
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH)
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < BREAKPOINT,
  )
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) return
      e.preventDefault()
      isDragging.current = true

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return
        const newWidth = Math.min(
          MAX_LEFT_WIDTH,
          Math.max(MIN_LEFT_WIDTH, moveEvent.clientX),
        )
        setLeftWidth(newWidth)
      }

      const handleMouseUp = () => {
        isDragging.current = false
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
    [isMobile],
  )

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div
          className={cn(
            'border-b border-border overflow-hidden transition-[height] duration-200',
            collapsed ? 'h-0' : 'h-2/5',
          )}
        >
          {leftPanel}
        </div>
        <div className="flex-1 overflow-hidden">{rightPanel}</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex h-full">
      <div
        className={cn(
          'shrink-0 overflow-hidden transition-[width] duration-150',
          collapsed ? 'w-0' : '',
        )}
        style={collapsed ? undefined : { width: leftWidth }}
      >
        {leftPanel}
      </div>

      <div
        className={cn(
          'shrink-0 w-[1px] bg-border cursor-col-resize hover:bg-primary/50 active:bg-primary transition-colors relative group',
          collapsed && 'hidden',
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <div className="flex-1 overflow-hidden">{rightPanel}</div>
    </div>
  )
}
