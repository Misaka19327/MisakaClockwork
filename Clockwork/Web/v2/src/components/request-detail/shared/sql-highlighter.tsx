import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'sql-formatter'
import Prism from 'prismjs'
import 'prismjs/components/prism-sql'

interface SqlHighlighterProps {
  sql: string
  className?: string
  maxHeight?: number
}

export function SqlHighlighter({ sql, className, maxHeight = 200 }: SqlHighlighterProps) {
  const highlighted = useMemo(() => {
    try {
      const formatted = format(sql, {
        language: 'sql',
        tabWidth: 2,
        keywordCase: 'upper',
      })
      return Prism.highlight(formatted, Prism.languages.sql, 'sql')
    } catch {
      try {
        return Prism.highlight(sql, Prism.languages.sql, 'sql')
      } catch {
        return sql.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      }
    }
  }, [sql])

  return (
    <div
      className={cn('overflow-auto rounded bg-gray-50 dark:bg-gray-900/50', className)}
      style={{ maxHeight }}
    >
      <pre className="p-3 text-xs leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  )
}
