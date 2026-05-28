import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import { useSettingsStore, type Locale } from '@/stores/settings-store'
import type { ThemeMode } from '@/types/clockwork'

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

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { t } = useTranslation()
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const editor = useSettingsStore((s) => s.editor)
  const setEditor = useSettingsStore((s) => s.setEditor)
  const localPathMap = useSettingsStore((s) => s.localPathMap)
  const setLocalPathMap = useSettingsStore((s) => s.setLocalPathMap)
  const metadataPath = useSettingsStore((s) => s.metadataPath)
  const setMetadataPath = useSettingsStore((s) => s.setMetadataPath)
  const locale = useSettingsStore((s) => s.locale)
  const setLocale = useSettingsStore((s) => s.setLocale)

  const [draftLocalPathMap, setDraftLocalPathMap] = useState('')
  const [draftMetadataPath, setDraftMetadataPath] = useState('')

  useEffect(() => {
    if (open) {
      const entries = Object.entries(localPathMap)
      setDraftLocalPathMap(
        entries.length > 0
          ? entries.map(([k, v]) => `${k} -> ${v}`).join('\n')
          : '',
      )
      setDraftMetadataPath(metadataPath)
    }
  }, [open, localPathMap, metadataPath])

  const handleSaveLocalPathMap = () => {
    const map: Record<string, string> = {}
    for (const line of draftLocalPathMap.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const idx = trimmed.indexOf('->')
      if (idx > 0) {
        const remote = trimmed.slice(0, idx).trim()
        const local = trimmed.slice(idx + 2).trim()
        if (remote && local) map[remote] = local
      }
    }
    setLocalPathMap(map)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border/60 bg-card p-6 shadow-xl"
        >
          <Dialog.Title className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Settings className="h-5 w-5" />
            {t('settings.title')}
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
            {/* Language */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">{t('settings.language')}</h3>
              <div className="space-y-2">
                {([
                  { value: 'zh-CN' as Locale, labelKey: 'settings.lang.zhCN' as const },
                  { value: 'en-US' as Locale, labelKey: 'settings.lang.enUS' as const },
                ]).map(({ value, labelKey }) => (
                  <label
                    key={value}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                      locale === value
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    <input
                      type="radio"
                      name="locale"
                      value={value}
                      checked={locale === value}
                      onChange={() => setLocale(value)}
                      className="accent-primary"
                    />
                    <span>{t(labelKey)}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Appearance */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">{t('settings.appearance')}</h3>
              <div className="space-y-2">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <label
                    key={mode}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                      theme === mode
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={mode}
                      checked={theme === mode}
                      onChange={() => setTheme(mode)}
                      className="accent-primary"
                    />
                    <span className="capitalize">{mode}</span>
                    {mode === 'system' && (
                      <span className="text-xs text-muted-foreground">
                        {t('settings.systemFollow')}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </section>

            {/* Editor */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">{t('settings.editor')}</h3>
              <select
                value={editor}
                onChange={(e) => setEditor(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              >
                {editors.map((ed) => (
                  <option key={ed.value} value={ed.value}>
                    {ed.label}
                  </option>
                ))}
              </select>
            </section>

            {/* Local Path Mapping */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">{t('settings.localPathMapping')}</h3>
              <textarea
                value={draftLocalPathMap}
                onChange={(e) => setDraftLocalPathMap(e.target.value)}
                onBlur={handleSaveLocalPathMap}
                placeholder="/remote/path -> /local/path"
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('settings.localPathMappingDesc')}
              </p>
            </section>

            {/* Metadata Path */}
            <section>
              <h3 className="mb-2 text-sm font-medium text-foreground">{t('settings.metadataPath')}</h3>
              <input
                type="text"
                value={draftMetadataPath}
                onChange={(e) => setDraftMetadataPath(e.target.value)}
                onBlur={() => setMetadataPath(draftMetadataPath)}
                placeholder="/path/to/clockwork/metadata"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('settings.metadataPathDesc')}
              </p>
            </section>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              {t('settings.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('settings.save')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
