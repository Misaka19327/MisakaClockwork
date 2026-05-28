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
const DESKTOP_PANEL_MIN = 340
const DESKTOP_PANEL_MAX = 620

function getDesktopLeftPanelWidth(viewportWidth: number) {
  return Math.min(Math.max(Math.round(viewportWidth * 0.34), 420), 540)
}

export function SplitView({
  leftPanel,
  rightPanel,
  expanded,
}: SplitViewProps) {
  const leftPanelRef = useRef<PanelImperativeHandle | null>(null)
  const rightPanelRef = useRef<PanelImperativeHandle | null>(null)
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth < BREAKPOINT,
  )

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
      if (expanded) {
        rightPanelRef.current?.collapse()
        leftPanelRef.current?.resize('100%')
        return
      }

      rightPanelRef.current?.expand()
      leftPanelRef.current?.resize(`${getDesktopLeftPanelWidth(window.innerWidth)}px`)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [expanded, isMobile])

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
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 min-w-0">
      <ResizablePanel
        id="request-list-panel"
        panelRef={leftPanelRef}
        defaultSize={`${getDesktopLeftPanelWidth(window.innerWidth)}px`}
        minSize={`${DESKTOP_PANEL_MIN}px`}
        maxSize={expanded ? '100%' : `${DESKTOP_PANEL_MAX}px`}
        groupResizeBehavior="preserve-pixel-size"
        className="min-w-[340px] overflow-hidden transition-[flex-grow,flex-basis] duration-300 ease-in-out"
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
        minSize="480px"
        className="min-w-0 overflow-hidden transition-[flex-grow,flex-basis] duration-300 ease-in-out"
      >
        {rightPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
