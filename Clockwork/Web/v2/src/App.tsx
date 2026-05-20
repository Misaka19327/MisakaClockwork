import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDarkMode } from '@/hooks/use-dark-mode'
import { useRequestStore } from '@/stores/request-store'
import { SplitView } from '@/components/layout/split-view'
import { cn } from '@/lib/utils'

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
  const clearRequests = useRequestStore((s) => s.clearRequests)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">
          Requests
        </span>
        <button
          onClick={clearRequests}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No requests yet
          </div>
        ) : (
          requests.map((req) => (
            <button
              key={req.id}
              onClick={() => selectRequest(req.id)}
              className={cn(
                'w-full text-left px-3 py-2 border-b border-border/50 hover:bg-accent transition-colors',
                selectedId === req.id && 'bg-accent',
              )}
            >
              <div className="flex items-center gap-2 text-xs">
                {req.method && (
                  <span className="font-mono font-medium text-muted-foreground shrink-0">
                    {req.method}
                  </span>
                )}
                <span className="truncate">
                  {req.uri ?? req.url ?? req.commandName ?? req.id}
                </span>
              </div>
              {req.responseStatus != null && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {req.responseStatus}{' '}
                  {req.responseDuration != null &&
                    `${req.responseDuration.toFixed(1)}ms`}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function RightPanel() {
  const selectedRequest = useRequestStore((s) => s.getSelectedRequest())

  if (!selectedRequest) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
        Select a request to view details
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold mb-2">Request Details</h2>
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">ID: </span>
              {selectedRequest.id}
            </div>
            <div>
              <span className="text-muted-foreground">Type: </span>
              {selectedRequest.type}
            </div>
            {(selectedRequest.uri ?? selectedRequest.url) && (
              <div>
                <span className="text-muted-foreground">URI: </span>
                {selectedRequest.uri ?? selectedRequest.url}
              </div>
            )}
            {selectedRequest.method && (
              <div>
                <span className="text-muted-foreground">Method: </span>
                {selectedRequest.method}
              </div>
            )}
            {selectedRequest.controller && (
              <div>
                <span className="text-muted-foreground">Controller: </span>
                {selectedRequest.controller}
              </div>
            )}
            {selectedRequest.responseStatus != null && (
              <div>
                <span className="text-muted-foreground">Status: </span>
                {selectedRequest.responseStatus}
              </div>
            )}
            {selectedRequest.responseDuration != null && (
              <div>
                <span className="text-muted-foreground">Duration: </span>
                {selectedRequest.responseDuration.toFixed(2)}ms
              </div>
            )}
            {selectedRequest.memoryUsage != null && (
              <div>
                <span className="text-muted-foreground">Memory: </span>
                {(selectedRequest.memoryUsage / 1024 / 1024).toFixed(2)}MB
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
