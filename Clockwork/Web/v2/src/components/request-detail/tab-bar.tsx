import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="h-auto gap-0 rounded-none border-0 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'relative rounded-none border-b-2 border-transparent px-3 py-2.5 text-sm font-medium',
                'text-muted-foreground/70 hover:text-foreground/80',
                'data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none',
              )}
            >
              {tab.label}
              {tab.badge != null && (
                <span className="ml-1.5 rounded-full bg-muted/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {tab.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
