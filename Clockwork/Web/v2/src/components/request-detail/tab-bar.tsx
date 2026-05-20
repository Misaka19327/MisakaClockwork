import { cn } from '@/lib/utils'
import * as Tabs from '@radix-ui/react-tabs'

export interface TabDef {
  id: string
  label: string
  badge?: number | string | null
}

interface TabBarProps {
  tabs: TabDef[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div className={cn('shrink-0 border-b border-border', className)}>
      <Tabs.Root value={activeTab} onValueChange={onTabChange}>
        <Tabs.List className="flex items-center gap-0 overflow-x-auto px-2">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'relative shrink-0 px-3 py-2 text-sm font-medium transition-colors',
                'text-muted-foreground hover:text-foreground',
                'data-[state=active]:text-foreground',
                'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent after:content-[""]',
                'data-[state=active]:after:bg-primary',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {tab.label}
                {tab.badge != null && (
                  <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {tab.badge}
                  </span>
                )}
              </span>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  )
}
