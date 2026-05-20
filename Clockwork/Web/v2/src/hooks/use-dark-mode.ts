import { useEffect, useState, useCallback } from 'react'
import { useSettingsStore } from '@/stores/settings-store'
import type { ThemeMode } from '@/types/clockwork'

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyDarkClass(isDark: boolean): void {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function useDarkMode() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const [systemDark, setSystemDark] = useState(getSystemPreference)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const isDark = theme === 'dark' || (theme === 'system' && systemDark)

  useEffect(() => {
    applyDarkClass(isDark)
  }, [isDark])

  const handleSetTheme = useCallback(
    (newTheme: ThemeMode) => {
      setTheme(newTheme)
    },
    [setTheme],
  )

  return { isDark, theme, setTheme: handleSetTheme } as const
}
