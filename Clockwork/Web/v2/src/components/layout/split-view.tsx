import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import { cn } from '@/lib/utils'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

interface SplitViewProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  expanded: boolean
}

const BREAKPOINT = 900
const DESKTOP_PANEL_MIN = 420
const DESKTOP_PANEL_MAX = 760
const DESKTOP_PANEL_ANIMATION_MS = 260

function getDesktopLeftPanelWidth(viewportWidth: number) {
  return Math.min(Math.max(Math.round(viewportWidth * 0.4), 520), 700)
}

export function SplitView({
  leftPanel,
  rightPanel,
  expanded,
}: SplitViewProps) {
  const leftPanelRef = useRef<PanelImperativeHandle | null>(null)
  const rightPanelRef = useRef<PanelImperativeHandle | null>(null)
  const groupElementRef = useRef<HTMLDivElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const collapseTimeoutRef = useRef<number | null>(null)
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < BREAKPOINT,
  )

  const stopAnimation = () => {
    if (animationFrameRef.current != null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (collapseTimeoutRef.current != null) {
      window.clearTimeout(collapseTimeoutRef.current)
      collapseTimeoutRef.current = null
    }
  }

  const animateLeftPanelTo = (targetWidth: number) => {
    stopAnimation()

    const panel = leftPanelRef.current
    if (!panel) return

    const startWidth = panel.getSize().inPixels
    const delta = targetWidth - startWidth

    if (Math.abs(delta) < 1) {
      panel.resize(`${targetWidth}px`)
      return
    }

    let startTime: number | null = null

    const step = (timestamp: number) => {
      if (startTime == null) startTime = timestamp

      const progress = Math.min((timestamp - startTime) / DESKTOP_PANEL_ANIMATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      panel.resize(`${startWidth + delta * eased}px`)

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(step)
      } else {
        panel.resize(`${targetWidth}px`)
        animationFrameRef.current = null
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(step)
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobile) return

    const frame = window.requestAnimationFrame(() => {
      const groupWidth = groupElementRef.current?.clientWidth ?? window.innerWidth

      if (expanded) {
        animateLeftPanelTo(groupWidth)
        collapseTimeoutRef.current = window.setTimeout(() => {
          rightPanelRef.current?.collapse()
          collapseTimeoutRef.current = null
        }, DESKTOP_PANEL_ANIMATION_MS)
        return
      }

      rightPanelRef.current?.expand()
      animateLeftPanelTo(getDesktopLeftPanelWidth(groupWidth))
    })

    return () => {
      window.cancelAnimationFrame(frame)
      stopAnimation()
    }
  }, [expanded, isMobile])

  useEffect(() => () => stopAnimation(), [])

  if (isMobile) {
    if (expanded) {
      return <div className="h-full w-full min-w-0 overflow-hidden">{leftPanel}</div>
    }

    return (
      <ResizablePanelGroup orientation="vertical" className="min-h-0 min-w-0">
        <ResizablePanel defaultSize={42} minSize={24} className="min-h-[220px] overflow-hidden">
          {leftPanel}
        </ResizablePanel>
        <ResizableHandle className="bg-border" />
        <ResizablePanel defaultSize={58} minSize={32} className="min-h-0 overflow-hidden">
          {rightPanel}
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="min-h-0 min-w-0"
      elementRef={groupElementRef}
    >
      <ResizablePanel
        id="request-list-panel"
        panelRef={leftPanelRef}
        defaultSize={`${getDesktopLeftPanelWidth(window.innerWidth)}px`}
        minSize={`${DESKTOP_PANEL_MIN}px`}
        maxSize={expanded ? '100%' : `${DESKTOP_PANEL_MAX}px`}
        groupResizeBehavior="preserve-pixel-size"
        className="min-w-[420px] overflow-hidden"
      >
        {leftPanel}
      </ResizablePanel>
      <ResizableHandle
        withHandle
        className={cn(
          'bg-border transition-opacity duration-200',
          expanded ? 'pointer-events-none opacity-0' : 'opacity-100 hover:bg-primary/50',
        )}
      />
      <ResizablePanel
        id="request-detail-panel"
        panelRef={rightPanelRef}
        collapsible
        collapsedSize={0}
        minSize={expanded ? '0px' : '480px'}
        className="min-w-0 overflow-hidden"
      >
        <div
          className={cn(
            'h-full w-full transition-all duration-300 ease-in-out',
            expanded ? 'translate-x-3 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100',
          )}
        >
          {rightPanel}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
