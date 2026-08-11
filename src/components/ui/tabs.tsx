'use client'

import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string = string> {
  key: T
  label: string
  badge?: number
}

type TabsVariant = 'default' | 'opera' | 'segmented'

interface TabsProps<T extends string = string> {
  items: TabItem<T>[]
  value: T
  onValueChange: (key: T) => void
  /** شناسهٔ پایه برای aria-controls — پیش‌فرض: panel */
  idPrefix?: string
  'aria-label'?: string
  className?: string
  /** variant جدید برای یکپارچه‌سازی با Opera-style */
  variant?: TabsVariant
}

/**
 * تب‌های سبک با نقش‌های ARIA استاندارد.
 * - default: استایل قدیمی با border-bottom
 * - opera / segmented: pill style جدا از هم، active cyan/blue، border نرم، hover، focus، badge
 */
export function Tabs<T extends string = string>({
  items,
  value,
  onValueChange,
  idPrefix = 'panel',
  'aria-label': ariaLabel = 'بخش‌ها',
  className,
  variant = 'default',
}: TabsProps<T>) {
  if (variant === 'opera' || variant === 'segmented') {
    const isSegmented = variant === 'segmented'
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn('flex flex-wrap gap-2.5', className)}
      >
        {items.map((t) => {
          const isActive = value === t.key
          const showBadge = t.badge !== undefined && t.badge !== null
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${idPrefix}-${t.key}`}
              id={`tab-${t.key}`}
              onClick={() => onValueChange(t.key)}
              className={cn(
                'h-9 min-w-[78px] rounded-full border px-4 text-xs font-bold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
                'hover:-translate-y-px',
                isActive
                  ? 'border-accent bg-accent text-accent-foreground shadow-[0_5px_14px_hsl(var(--accent)/0.25)]'
                  : 'border-border bg-surface-3 text-foreground hover:border-accent/40 hover:bg-surface-2',
                isSegmented && 'rounded-lg'
              )}
            >
              {t.label}
              {showBadge ? (
                <span className="ms-1.5 text-[10px] opacity-80">{formatNumber(t.badge as number)}</span>
              ) : null}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-1 border-b border-border', className)}
    >
      {items.map((t) => {
        const showBadge = t.badge !== undefined && t.badge !== null
        return (
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
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              value === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            {showBadge ? (
              <span className="rounded-full bg-surface-2 px-1.5 text-[10px] text-muted-foreground">
                {formatNumber(t.badge as number)}
              </span>
            ) : null}
          </button>
        )
      })}
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
    <div role="tabpanel" id={id} aria-labelledby={tabId} className={cn('pt-8', className)}>
      {children}
    </div>
  )
}
