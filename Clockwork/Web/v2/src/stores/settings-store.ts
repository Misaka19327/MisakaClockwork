import { create } from 'zustand'
import type { ThemeMode } from '@/types/clockwork'

const STORAGE_KEY = 'clockwork-settings'

interface SettingsState {
  theme: ThemeMode
  editor: string
  localPathMap: Record<string, string>
  metadataPath: string
  showContext: boolean

  setTheme: (theme: ThemeMode) => void
  setEditor: (editor: string) => void
  setLocalPathMap: (map: Record<string, string>) => void
  setMetadataPath: (path: string) => void
  setShowContext: (value: boolean) => void
}

interface StoredSettings {
  theme?: ThemeMode
  editor?: string
  localPathMap?: Record<string, string>
  metadataPath?: string
  showContext?: boolean
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

  setTheme: (theme) => {
    set({ theme })
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
