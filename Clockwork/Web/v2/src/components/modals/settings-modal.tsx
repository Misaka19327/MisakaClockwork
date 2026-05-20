import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ThemeMode } from '@/types/clockwork'

const SETTINGS_KEY = 'clockwork-settings'

export interface ClockworkSettings {
  theme: ThemeMode
  editor: string
  localPathMap: string
  metadataPath: string
}

const defaultSettings: ClockworkSettings = {
  theme: 'system',
  editor: 'phpstorm',
  localPathMap: '',
  metadataPath: '',
}

const editors = [
  { value: 'vscode', label: 'VS Code' },
  { value: 'phpstorm', label: 'PhpStorm' },
  { value: 'sublime', label: 'Sublime Text' },
  { value: 'atom', label: 'Atom' },
  { value: 'textmate', label: 'TextMate' },
  { value: 'emacs', label: 'Emacs' },
  { value: 'vim', label: 'Vim' },
  { value: 'idea', label: 'IntelliJ IDEA' },
]

export function loadSettings(): ClockworkSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) }
    }
  } catch {
    // ignore
  }
  return { ...defaultSettings }
}

export function saveSettings(settings: ClockworkSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettingsChange?: (settings: ClockworkSettings) => void
}

export function SettingsModal({ open, onOpenChange, onSettingsChange }: SettingsModalProps) {
  const [settings, setSettings] = useState<ClockworkSettings>(loadSettings)

  useEffect(() => {
    setSettings(loadSettings())
  }, [open])

  const updateSetting = <K extends keyof ClockworkSettings>(
    key: K,
    value: ClockworkSettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    saveSettings(settings)
    onSettingsChange?.(settings)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSettings(loadSettings())
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg"
        >
          <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Settings className="h-5 w-5" />
            Settings
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-3 top-3 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          <div className="mt-4 space-y-5">
            {/* Appearance */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">Appearance</h3>
              <div className="space-y-2">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <label
                    key={mode}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                      settings.theme === mode
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={mode}
                      checked={settings.theme === mode}
                      onChange={() => updateSetting('theme', mode)}
                      className="accent-primary"
                    />
                    <span className="capitalize">{mode}</span>
                    {mode === 'system' && (
                      <span className="text-xs text-muted-foreground">
                        (follows OS setting)
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>

            {/* Editor */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">Editor</h3>
              <select
                value={settings.editor}
                onChange={(e) => updateSetting('editor', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              >
                {editors.map((editor) => (
                  <option key={editor.value} value={editor.value}>
                    {editor.label}
                  </option>
                ))}
              </select>
            </section>

            {/* Local Path Mapping */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">Local Path Mapping</h3>
              <input
                type="text"
                value={settings.localPathMap}
                onChange={(e) => updateSetting('localPathMap', e.target.value)}
                placeholder="/remote/path -> /local/path"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Map remote paths to local paths for file links
              </p>
            </section>

            {/* Metadata Path */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">Metadata Path</h3>
              <input
                type="text"
                value={settings.metadataPath}
                onChange={(e) => updateSetting('metadataPath', e.target.value)}
                placeholder="/path/to/clockwork/metadata"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Path to Clockwork metadata storage directory
              </p>
            </section>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
