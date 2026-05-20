import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthModalProps {
  open: boolean
  onAuthenticate: (username: string, password: string) => Promise<boolean>
  onClose?: () => void
}

export function AuthModal({ open, onAuthenticate, onClose }: AuthModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const success = await onAuthenticate(username, password)
      if (!success) {
        setError('Invalid credentials. Please try again.')
      }
    } catch (err) {
      setError('Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg"
        >
          <Dialog.Title className="text-lg font-semibold text-foreground">
            Authentication Required
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            This Clockwork instance requires authentication.
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="auth-username"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                placeholder="Username"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                placeholder="Password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors',
                'hover:bg-primary/90',
                'disabled:pointer-events-none disabled:opacity-50',
              )}
            >
              <Lock className="h-4 w-4" />
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
