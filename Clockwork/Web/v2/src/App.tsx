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
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
        {/* Top bar */}
        <div className="shrink-0 flex items-center border-b border-border px-4 h-9">
          <span className="text-sm font-semibold tracking-tight">MisakaClockWork</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
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
    />
  )
}

function RightPanel() {
  const selectedRequest = useRequestStore((s) => s.getSelectedRequest())

  return <RequestDetail request={selectedRequest ?? null} />
}
