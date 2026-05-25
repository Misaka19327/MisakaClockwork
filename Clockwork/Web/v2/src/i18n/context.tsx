import { createContext, useContext, useMemo, type ReactNode } from 'react'
import zhCN from './translations/zh-CN'
import enUS from './translations/en-US'
import type { TranslationKey } from './translations/zh-CN'

type Translations = Record<TranslationKey, string>

const translations: Record<string, Translations> = {
  'zh-CN': zhCN as unknown as Translations,
  'en-US': enUS,
}

type Locale = 'zh-CN' | 'en-US'

interface I18nContextValue {
  locale: Locale
  t: (key: TranslationKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'zh-CN',
  t: (key) => key,
})

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  const value = useMemo(() => {
    const dict = translations[locale] ?? translations['zh-CN']
    return {
      locale,
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let text = dict[key] ?? key
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, String(v))
          }
        }
        return text
      },
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation() {
  return useContext(I18nContext)
}

export type { Locale, TranslationKey }
