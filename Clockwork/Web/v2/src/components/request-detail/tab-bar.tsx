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
    <div className={cn('shrink-0 border-b border-border/50', className)}>
      <Tabs.Root value={activeTab} onValueChange={onTabChange}>
        <Tabs.List className="flex items-center gap-0 overflow-x-auto px-3">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                'text-muted-foreground/70 hover:text-foreground/80',
                'data-[state=active]:text-foreground',
                'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:rounded-full after:bg-transparent after:content-[""] after:transition-colors duration-150',
                'data-[state=active]:after:bg-primary',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {tab.label}
                {tab.badge != null && (
                  <span className="rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
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
