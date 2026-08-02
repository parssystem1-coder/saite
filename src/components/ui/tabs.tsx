'use client'

import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string = string> {
  key: T
  label: string
  badge?: number
}

interface TabsProps<T extends string = string> {
  items: TabItem<T>[]
  value: T
  onValueChange: (key: T) => void
  /** شناسهٔ پایه برای aria-controls — پیش‌فرض: panel */
  idPrefix?: string
  'aria-label'?: string
  className?: string
}

/**
 * تب‌های سبک با نقش‌های ARIA استاندارد.
 * بدون وابستگی به کتابخانهٔ خارجی.
 */
export function Tabs<T extends string = string>({
  items,
  value,
  onValueChange,
  idPrefix = 'panel',
  'aria-label': ariaLabel = 'بخش‌ها',
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-1 border-b border-border', className)}
    >
      {items.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          aria-controls={`${idPrefix}-${t.key}`}
          id={`tab-${t.key}`}
          onClick={() => onValueChange(t.key)}
          className={cn(
            '-mb-px flex items-center gap-1.5 border-b-2 px-5 py-3 text-sm font-bold transition-colors',
            value === t.key
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {t.label}
          {t.badge ? (
            <span className="rounded-full bg-surface-2 px-1.5 text-[10px] text-muted-foreground">
              {formatNumber(t.badge)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

interface TabPanelProps {
  id: string
  tabId: string
  active: boolean
  className?: string
  children: React.ReactNode
}

export function TabPanel({ id, tabId, active, className, children }: TabPanelProps) {
  if (!active) return null

  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={tabId}
      className={cn('pt-8', className)}
    >
      {children}
    </div>
  )
}
