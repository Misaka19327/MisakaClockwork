import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { PanelImperativeHandle } from 'react-resizable-panels'
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
const DESKTOP_PANEL_MIN = 320
const DESKTOP_PANEL_MAX = 520

function getDesktopLeftPanelWidth(viewportWidth: number) {
  return Math.min(Math.max(Math.round(viewportWidth * 0.28), 360), 460)
}

export function SplitView({
  leftPanel,
  rightPanel,
  expanded,
}: SplitViewProps) {
  const leftPanelRef = useRef<PanelImperativeHandle | null>(null)
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
    if (isMobile || expanded) return

    const width = getDesktopLeftPanelWidth(window.innerWidth)
    const frame = window.requestAnimationFrame(() => {
      leftPanelRef.current?.resize(`${width}px`)
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

  if (expanded) {
    return <div className="h-full w-full min-w-0 overflow-hidden">{leftPanel}</div>
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 min-w-0">
      <ResizablePanel
        id="request-list-panel"
        panelRef={leftPanelRef}
        defaultSize={`${getDesktopLeftPanelWidth(window.innerWidth)}px`}
        minSize={`${DESKTOP_PANEL_MIN}px`}
        maxSize={`${DESKTOP_PANEL_MAX}px`}
        groupResizeBehavior="preserve-pixel-size"
        className="min-w-[320px] overflow-hidden"
      >
        {leftPanel}
      </ResizablePanel>
      <ResizableHandle withHandle className="bg-border hover:bg-primary/50" />
      <ResizablePanel
        id="request-detail-panel"
        minSize="480px"
        className="min-w-0 overflow-hidden"
      >
        {rightPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
