import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import { useSettingsStore, type Locale } from '@/stores/settings-store'
import type { ThemeMode } from '@/types/clockwork'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Language */}
          <section>
            <Label className="mb-2 block text-sm font-medium">{t('settings.language')}</Label>
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
            <Label className="mb-2 block text-sm font-medium">{t('settings.appearance')}</Label>
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
                    <span className="text-xs text-muted-foreground">{t('settings.systemFollow')}</span>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Editor */}
          <section>
            <Label className="mb-2 block text-sm font-medium">{t('settings.editor')}</Label>
            <Select value={editor} onValueChange={setEditor}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {editors.map((ed) => (
                  <SelectItem key={ed.value} value={ed.value}>{ed.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {/* Local Path Mapping */}
          <section>
            <Label className="mb-2 block text-sm font-medium">{t('settings.localPathMapping')}</Label>
            <textarea
              value={draftLocalPathMap}
              onChange={(e) => setDraftLocalPathMap(e.target.value)}
              onBlur={handleSaveLocalPathMap}
              placeholder="/remote/path -> /local/path"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('settings.localPathMappingDesc')}</p>
          </section>

          {/* Metadata Path */}
          <section>
            <Label className="mb-2 block text-sm font-medium">{t('settings.metadataPath')}</Label>
            <Input
              value={draftMetadataPath}
              onChange={(e) => setDraftMetadataPath(e.target.value)}
              onBlur={() => setMetadataPath(draftMetadataPath)}
              placeholder="/path/to/clockwork/metadata"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t('settings.metadataPathDesc')}</p>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('settings.cancel')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t('settings.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
