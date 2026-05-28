import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { useRequestStore } from '@/stores/request-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useRequestList, useLoadOlder } from '@/api/requests'
import { Button } from '@/components/ui/button'
import { SplitView } from '@/components/layout/split-view'
import { RequestList } from '@/components/request-list/request-list'
import { RequestDetail } from '@/components/request-detail/request-detail'
import { SettingsModal } from '@/components/modals/settings-modal'
import { I18nProvider } from '@/i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useDarkMode()
  return <>{children}</>
}

export default function App() {
  const selectedId = useRequestStore((s) => s.selectedId)
  const searchFilters = useRequestStore((s) => s.searchFilters)
  const oldestId = useRequestStore((s) => s.oldestId)
  const { isLoading } = useRequestList(searchFilters)
  const loadOlder = useLoadOlder(oldestId, searchFilters)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutInner
          expanded={selectedId === null}
          isLoading={isLoading}
          onLoadOlder={loadOlder}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function LayoutInner({
  expanded,
  isLoading,
  onLoadOlder,
}: {
  expanded: boolean
  isLoading: boolean
  onLoadOlder: () => Promise<void>
}) {
  const locale = useSettingsStore((s) => s.locale)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <I18nProvider locale={locale}>
      <div className="flex h-screen w-full min-w-0 flex-col overflow-hidden bg-background text-foreground">
        {/* Top bar */}
        <div className="flex h-10 shrink-0 items-center border-b border-border/70 bg-sidebar-background/50 px-4">
          <span className="text-[13px] font-semibold tracking-tight text-foreground/90">MisakaClockWork</span>
          <div className="flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="size-8 text-muted-foreground"
          >
            <Settings />
          </Button>
        </div>
        {/* Main content */}
        <div className="flex min-h-0 w-full min-w-0 flex-1 overflow-hidden">
          <SplitView
            leftPanel={
              <LeftPanel
                expanded={expanded}
                isLoading={isLoading}
                onLoadOlder={onLoadOlder}
              />
            }
            rightPanel={<RightPanel />}
            expanded={expanded}
          />
        </div>
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </I18nProvider>
  )
}

function LeftPanel({
  expanded,
  isLoading,
  onLoadOlder,
}: {
  expanded: boolean
  isLoading: boolean
  onLoadOlder: () => Promise<void>
}) {
  const requests = useRequestStore((s) => s.requests)
  const selectedId = useRequestStore((s) => s.selectedId)
  const selectRequest = useRequestStore((s) => s.selectRequest)
  const searchFilters = useRequestStore((s) => s.searchFilters)
  const setSearchFilters = useRequestStore((s) => s.setSearchFilters)
  const oldestId = useRequestStore((s) => s.oldestId)

  return (
    <RequestList
      requests={requests}
      selectedId={selectedId}
      onSelectRequest={(req) => selectRequest(req.id)}
      onLoadOlder={onLoadOlder}
      isLoading={isLoading}
      hasMore={!!oldestId}
      filters={searchFilters}
      onFiltersChange={setSearchFilters}
      compact={!expanded}
      expanded={expanded}
    />
  )
}

function RightPanel() {
  const selectedId = useRequestStore((s) => s.selectedId)
  const requests = useRequestStore((s) => s.requests)
  const selectedRequest = selectedId ? requests.find((r) => r.id === selectedId) ?? null : null

  return <RequestDetail request={selectedRequest} />
}
