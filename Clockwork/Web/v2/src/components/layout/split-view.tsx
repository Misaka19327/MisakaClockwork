import { useEffect, useState, type ReactNode } from 'react'
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

export function SplitView({
  leftPanel,
  rightPanel,
  expanded,
}: SplitViewProps) {
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
        defaultSize={30}
        minSize={9}
        maxSize={62}
        className="min-w-[180px] overflow-hidden"
      >
        {leftPanel}
      </ResizablePanel>
      <ResizableHandle className="bg-border hover:bg-primary/50" />
      <ResizablePanel defaultSize={64} minSize={32} className="min-w-0 overflow-hidden">
        {rightPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
