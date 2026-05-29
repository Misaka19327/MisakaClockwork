import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import { useSettingsStore, type Locale } from '@/stores/settings-store'
import type { PollingIntervalOption, ThemeMode } from '@/types/clockwork'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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

const pollingIntervals: { value: PollingIntervalOption; label: string }[] = [
  { value: '1000', label: '1 秒' },
  { value: '5000', label: '5 秒' },
  { value: '10000', label: '10 秒' },
  { value: '30000', label: '30 秒' },
  { value: '60000', label: '1 分钟' },
  { value: '120000', label: '2 分钟' },
  { value: '180000', label: '3 分钟' },
  { value: '240000', label: '4 分钟' },
  { value: '300000', label: '5 分钟' },
  { value: '360000', label: '6 分钟' },
  { value: '420000', label: '7 分钟' },
  { value: '480000', label: '8 分钟' },
  { value: '540000', label: '9 分钟' },
  { value: '600000', label: '10 分钟' },
]

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { t } = useTranslation()
  const theme = useSettingsStore((s) => s.theme); const setTheme = useSettingsStore((s) => s.setTheme)
  const editor = useSettingsStore((s) => s.editor); const setEditor = useSettingsStore((s) => s.setEditor)
  const localPathMap = useSettingsStore((s) => s.localPathMap); const setLocalPathMap = useSettingsStore((s) => s.setLocalPathMap)
  const metadataPath = useSettingsStore((s) => s.metadataPath); const setMetadataPath = useSettingsStore((s) => s.setMetadataPath)
  const locale = useSettingsStore((s) => s.locale); const setLocale = useSettingsStore((s) => s.setLocale)
  const pollingEnabled = useSettingsStore((s) => s.pollingEnabled); const setPollingEnabled = useSettingsStore((s) => s.setPollingEnabled)
  const pollingInterval = useSettingsStore((s) => s.pollingInterval); const setPollingInterval = useSettingsStore((s) => s.setPollingInterval)

  const [draftPathMap, setDraftPathMap] = useState('')
  const [draftMeta, setDraftMeta] = useState('')

  useEffect(() => {
    if (open) {
      const e = Object.entries(localPathMap)
      setDraftPathMap(e.length > 0 ? e.map(([k, v]) => `${k} -> ${v}`).join('\n') : '')
      setDraftMeta(metadataPath)
    }
  }, [open, localPathMap, metadataPath])

  const savePathMap = () => {
    const map: Record<string, string> = {}
    for (const line of draftPathMap.split('\n')) {
      const t = line.trim(); if (!t) continue
      const i = t.indexOf('->')
      if (i > 0) { const r = t.slice(0, i).trim(); const l = t.slice(i + 2).trim(); if (r && l) map[r] = l }
    }
    setLocalPathMap(map)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5" />
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
                <label key={value} className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                  locale === value ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50',
                )}>
                  <input type="radio" name="locale" value={value} checked={locale === value} onChange={() => setLocale(value)} className="accent-primary" />
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
                <label key={mode} className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                  theme === mode ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50',
                )}>
                  <input type="radio" name="theme" value={mode} checked={theme === mode} onChange={() => setTheme(mode)} className="accent-primary" />
                  <span className="capitalize">{mode}</span>
                  {mode === 'system' && <span className="text-xs text-muted-foreground">{t('settings.systemFollow')}</span>}
                </label>
              ))}
            </div>
          </section>

          {/* Editor */}
          <section>
            <Label className="mb-2 block text-sm font-medium">{t('settings.editor')}</Label>
            <Select value={editor} onValueChange={(value) => value && setEditor(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {editors.map((ed) => <SelectItem key={ed.value} value={ed.value}>{ed.label}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </section>

          {/* Polling */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm font-medium">{t('settings.polling')}</Label>
              <Switch checked={pollingEnabled} onCheckedChange={setPollingEnabled} />
            </div>
            <Select value={pollingInterval} onValueChange={(value) => setPollingInterval(value as PollingIntervalOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {pollingIntervals.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </section>

          {/* Path mapping */}
          <section>
            <Label className="mb-2 block text-sm font-medium">{t('settings.localPathMapping')}</Label>
            <textarea value={draftPathMap} onChange={(e) => setDraftPathMap(e.target.value)} onBlur={savePathMap}
              placeholder="/remote/path -> /local/path" rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring resize-none" />
            <p className="mt-1 text-xs text-muted-foreground">{t('settings.localPathMappingDesc')}</p>
          </section>

          {/* Metadata path */}
          <section>
            <Label className="mb-2 block text-sm font-medium">{t('settings.metadataPath')}</Label>
            <Input value={draftMeta} onChange={(e) => setDraftMeta(e.target.value)} onBlur={() => setMetadataPath(draftMeta)}
              placeholder="/path/to/clockwork/metadata" />
            <p className="mt-1 text-xs text-muted-foreground">{t('settings.metadataPathDesc')}</p>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('settings.cancel')}</Button>
          <Button onClick={() => onOpenChange(false)}>{t('settings.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
