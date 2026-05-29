import { create } from 'zustand'
import type { PollingIntervalOption, ThemeMode } from '@/types/clockwork'

const STORAGE_KEY = 'clockwork-settings'

export type Locale = 'zh-CN' | 'en-US'

interface SettingsState {
  theme: ThemeMode
  editor: string
  localPathMap: Record<string, string>
  metadataPath: string
  showContext: boolean
  locale: Locale
  pollingEnabled: boolean
  pollingInterval: PollingIntervalOption

  setTheme: (theme: ThemeMode) => void
  setEditor: (editor: string) => void
  setLocalPathMap: (map: Record<string, string>) => void
  setMetadataPath: (path: string) => void
  setShowContext: (value: boolean) => void
  setLocale: (locale: Locale) => void
  setPollingEnabled: (value: boolean) => void
  setPollingInterval: (value: PollingIntervalOption) => void
}

interface StoredSettings {
  theme?: ThemeMode
  editor?: string
  localPathMap?: Record<string, string>
  metadataPath?: string
  showContext?: boolean
  locale?: Locale
  pollingEnabled?: boolean
  pollingInterval?: PollingIntervalOption
}

function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as StoredSettings
    }
  } catch {
    // ignore parse errors
  }
  return {}
}

function persistState(state: SettingsState): void {
  try {
    const data: StoredSettings = {
      theme: state.theme,
      editor: state.editor,
      localPathMap: state.localPathMap,
      metadataPath: state.metadataPath,
      showContext: state.showContext,
      locale: state.locale,
      pollingEnabled: state.pollingEnabled,
      pollingInterval: state.pollingInterval,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore storage errors
  }
}

const stored = loadSettings()

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: stored.theme ?? 'system',
  editor: stored.editor ?? 'vscode',
  localPathMap: stored.localPathMap ?? {},
  metadataPath: stored.metadataPath ?? '',
  showContext: stored.showContext ?? true,
  locale: stored.locale ?? 'zh-CN',
  pollingEnabled: stored.pollingEnabled ?? true,
  pollingInterval: stored.pollingInterval ?? '5000',

  setTheme: (theme) => {
    set({ theme })
    persistState(get())
  },

  setLocale: (locale) => {
    set({ locale })
    persistState(get())
  },

  setPollingEnabled: (pollingEnabled) => {
    set({ pollingEnabled })
    persistState(get())
  },

  setPollingInterval: (pollingInterval) => {
    set({ pollingInterval })
    persistState(get())
  },

  setEditor: (editor) => {
    set({ editor })
    persistState(get())
  },

  setLocalPathMap: (localPathMap) => {
    set({ localPathMap })
    persistState(get())
  },

  setMetadataPath: (metadataPath) => {
    set({ metadataPath })
    persistState(get())
  },

  setShowContext: (showContext) => {
    set({ showContext })
    persistState(get())
  },
}))
