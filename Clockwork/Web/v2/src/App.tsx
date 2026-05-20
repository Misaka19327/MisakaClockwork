import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { useRequestStore } from '@/stores/request-store'
import { useRequestList, useLoadOlder } from '@/api/requests'
import { SplitView } from '@/components/layout/split-view'
import { RequestList } from '@/components/request-list/request-list'
import { RequestDetail } from '@/components/request-detail/request-detail'

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
  const collapsed = useRequestStore((s) => s.collapsed)
  const setCollapsed = useRequestStore((s) => s.setCollapsed)

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
          <SplitView
            leftPanel={<LeftPanel />}
            rightPanel={<RightPanel />}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function LeftPanel() {
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
    />
  )
}

function RightPanel() {
  const selectedRequest = useRequestStore((s) => s.getSelectedRequest())

  return <RequestDetail request={selectedRequest ?? null} />
}
