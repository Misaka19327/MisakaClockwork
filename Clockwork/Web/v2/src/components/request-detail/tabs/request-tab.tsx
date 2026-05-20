import { cn } from '@/lib/utils'
import type { ClockworkRequest } from '@/types/clockwork'
import { MethodBadge } from '../shared/method-badge'
import { StatusBadge } from '../shared/status-badge'
import { KeyValueTable } from '../shared/key-value-table'

interface RequestTabProps {
  request: ClockworkRequest
  className?: string
}

export function RequestTab({ request, className }: RequestTabProps) {
  if (request.type === 'command') {
    return <CommandRequestTab request={request} className={className} />
  }
  if (request.type === 'queue-job') {
    return <QueueRequestTab request={request} className={className} />
  }
  if (request.type === 'test') {
    return <TestRequestTab request={request} className={className} />
  }
  return <HttpRequestTab request={request} className={className} />
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  )
}

function HttpRequestTab({ request, className }: { request: ClockworkRequest; className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      {/* Basic info */}
      <Section title="Request">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">Method</span>
          <MethodBadge method={request.method} />
          <span className="text-muted-foreground">URI</span>
          <span className="font-mono text-xs break-all">{request.uri ?? request.url ?? 'N/A'}</span>
          {request.controller && (
            <>
              <span className="text-muted-foreground">Controller</span>
              <span className="font-mono text-xs">{request.controller}</span>
            </>
          )}
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={request.responseStatus} />
        </div>
      </Section>

      {/* Middleware */}
      {request.middleware && request.middleware.length > 0 && (
        <Section title="Middleware">
          <div className="flex flex-wrap gap-1">
            {request.middleware.map((mw, i) => (
              <span
                key={i}
                className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {mw}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Headers */}
      {request.headers && Object.keys(request.headers).length > 0 && (
        <Section title="Headers">
          <div className="rounded border border-border">
            <KeyValueTable
              data={Object.fromEntries(
                Object.entries(request.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : v]),
              )}
            />
          </div>
        </Section>
      )}

      {/* GET Data */}
      {request.getData && Object.keys(request.getData).length > 0 && (
        <Section title="GET Data">
          <div className="rounded border border-border">
            <KeyValueTable data={request.getData} />
          </div>
        </Section>
      )}

      {/* POST Data */}
      {request.postData && Object.keys(request.postData).length > 0 && (
        <Section title="POST Data">
          <div className="rounded border border-border">
            <KeyValueTable data={request.postData} />
          </div>
        </Section>
      )}

      {/* Session */}
      {request.sessionData && Object.keys(request.sessionData).length > 0 && (
        <Section title="Session">
          <div className="rounded border border-border">
            <KeyValueTable data={request.sessionData} />
          </div>
        </Section>
      )}

      {/* Cookies */}
      {request.cookies && Object.keys(request.cookies).length > 0 && (
        <Section title="Cookies">
          <div className="rounded border border-border">
            <KeyValueTable data={Object.fromEntries(Object.entries(request.cookies))} />
          </div>
        </Section>
      )}

      {/* Authenticated User */}
      {request.authenticatedUser && (
        <Section title="Authenticated User">
          <div className="rounded border border-border">
            <KeyValueTable data={request.authenticatedUser as Record<string, unknown>} />
          </div>
        </Section>
      )}
    </div>
  )
}

function CommandRequestTab({ request, className }: { request: ClockworkRequest; className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <Section title="Command">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-mono text-xs">{request.commandName ?? 'N/A'}</span>
          {request.commandExitCode != null && (
            <>
              <span className="text-muted-foreground">Exit Code</span>
              <span className="font-mono text-xs">{request.commandExitCode}</span>
            </>
          )}
        </div>
      </Section>

      {request.commandArguments && Object.keys(request.commandArguments).length > 0 && (
        <Section title="Arguments">
          <div className="rounded border border-border">
            <KeyValueTable data={request.commandArguments} />
          </div>
        </Section>
      )}

      {request.commandOptions && Object.keys(request.commandOptions).length > 0 && (
        <Section title="Options">
          <div className="rounded border border-border">
            <KeyValueTable data={request.commandOptions} />
          </div>
        </Section>
      )}

      {request.commandOutput && (
        <Section title="Output">
          <pre className="max-h-64 overflow-auto rounded border border-border bg-muted/50 p-3 text-xs">
            {request.commandOutput}
          </pre>
        </Section>
      )}
    </div>
  )
}

function QueueRequestTab({ request, className }: { request: ClockworkRequest; className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <Section title="Queue Job">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-mono text-xs">{request.jobName ?? 'N/A'}</span>
          {request.jobQueue && (
            <>
              <span className="text-muted-foreground">Queue</span>
              <span className="font-mono text-xs">{request.jobQueue}</span>
            </>
          )}
          {request.jobConnection && (
            <>
              <span className="text-muted-foreground">Connection</span>
              <span className="font-mono text-xs">{request.jobConnection}</span>
            </>
          )}
          {request.jobStatus && (
            <>
              <span className="text-muted-foreground">Status</span>
              <span className="font-mono text-xs">{request.jobStatus}</span>
            </>
          )}
        </div>
      </Section>

      {request.jobDescription && (
        <Section title="Description">
          <p className="text-sm text-muted-foreground">{request.jobDescription}</p>
        </Section>
      )}

      {request.jobPayload != null && (
        <Section title="Payload">
          <div className="rounded border border-border">
            <KeyValueTable data={{ payload: request.jobPayload }} />
          </div>
        </Section>
      )}

      {request.jobOptions && Object.keys(request.jobOptions).length > 0 && (
        <Section title="Options">
          <div className="rounded border border-border">
            <KeyValueTable data={request.jobOptions} />
          </div>
        </Section>
      )}
    </div>
  )
}

function TestRequestTab({ request, className }: { request: ClockworkRequest; className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <Section title="Test">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-mono text-xs">{request.testName ?? 'N/A'}</span>
          {request.testStatus && (
            <>
              <span className="text-muted-foreground">Status</span>
              <span
                className={cn(
                  'font-mono text-xs font-semibold',
                  request.testStatus === 'passed' && 'text-emerald-600 dark:text-emerald-400',
                  request.testStatus === 'failed' && 'text-red-600 dark:text-red-400',
                )}
              >
                {request.testStatus}
              </span>
            </>
          )}
        </div>
      </Section>

      {request.testStatusMessage && (
        <Section title="Status Message">
          <pre className="whitespace-pre-wrap rounded border border-border bg-muted/50 p-3 text-xs">
            {request.testStatusMessage}
          </pre>
        </Section>
      )}

      {request.testAsserts && request.testAsserts.length > 0 && (
        <Section title="Asserts">
          <div className="space-y-1">
            {request.testAsserts.map((assert, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 rounded px-2 py-1 text-xs',
                  assert.pass === true && 'bg-emerald-50 dark:bg-emerald-900/20',
                  assert.pass === false && 'bg-red-50 dark:bg-red-900/20',
                  assert.pass == null && 'bg-muted/50',
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    assert.pass === true && 'bg-emerald-500',
                    assert.pass === false && 'bg-red-500',
                    assert.pass == null && 'bg-gray-400',
                  )}
                />
                <span className="font-mono text-muted-foreground">
                  {assert.name ?? `Assert #${i + 1}`}
                </span>
                {assert.file && (
                  <span className="ml-auto text-muted-foreground">
                    {assert.file}{assert.line ? `:${assert.line}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
