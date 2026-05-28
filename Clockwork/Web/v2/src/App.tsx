import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { useRequestStore } from '@/stores/request-store'
import { useSettingsStore } from '@/stores/settings-store'
import { useRequestList, useLoadOlder } from '@/api/requests'
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

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LayoutInner expanded={selectedId === null} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function LayoutInner({ expanded }: { expanded: boolean }) {
  const locale = useSettingsStore((s) => s.locale)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <I18nProvider locale={locale}>
      <div className="h-screen w-full flex flex-col overflow-hidden bg-background text-foreground">
        {/* Top bar */}
        <div className="shrink-0 flex items-center border-b border-border/70 px-4 h-10 bg-sidebar-background/50">
          <span className="text-[13px] font-semibold tracking-tight text-foreground/90">MisakaClockWork</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          <SplitView
            leftPanel={<LeftPanel expanded={expanded} />}
            rightPanel={<RightPanel />}
            expanded={expanded}
          />
        </div>
      </div>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </I18nProvider>
  )
}

function LeftPanel({ expanded }: { expanded: boolean }) {
  const requests = useRequestStore((s) => s.requests)
  const selectedId = useRequestStore((s) => s.selectedId)
  const selectRequest = useRequestStore((s) => s.selectRequest)
  const searchFilters = useRequestStore((s) => s.searchFilters)
  const setSearchFilters = useRequestStore((s) => s.setSearchFilters)
  const oldestId = useRequestStore((s) => s.oldestId)

  const { isLoading } = useRequestList(searchFilters)
  const loadOlder = useLoadOlder(oldestId, searchFilters)

  return (
    <RequestList
      requests={requests}
      selectedId={selectedId}
      onSelectRequest={(req) => selectRequest(req.id)}
      onLoadOlder={loadOlder}
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
