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
  idPrefix?: string
  'aria-label'?: string
  className?: string
  variant?: TabsVariant
}

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
      <div role="tablist" aria-label={ariaLabel} className={cn('flex flex-wrap gap-2.5', className)}>
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
                'h-9 min-w-[78px] rounded-full border px-4 text-[11px] font-extrabold transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#27d4ee] focus-visible:ring-offset-2',
                'hover:-translate-y-px',
                isActive
                  ? 'bg-[#27d4ee] border-[#79e7f5] text-[#09263b] shadow-[0_6px_15px_#27d4ee47,inset_0_1px_0_#ffffff66]'
                  : 'bg-[#536a9c] border-[#b8d6ff2b] text-[#f1f5ff] shadow-[inset_0_1px_0_#ffffff2e,0_5px_12px_#07122733] hover:brightness-[1.12]',
                isSegmented && 'rounded-lg'
              )}
            >
              {t.label}
              {showBadge ? <small className="ms-1.5 text-[9px] opacity-80">{formatNumber(t.badge as number)}</small> : null}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('flex flex-wrap gap-1 border-b border-[#526987]', className)}>
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
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#27d4ee] focus-visible:ring-offset-2',
              value === t.key ? 'border-[#27d4ee] text-[#27d4ee]' : 'border-transparent text-[#b7c5da] hover:text-[#edf3ff]'
            )}
          >
            {t.label}
            {showBadge ? (
              <span className="rounded-full bg-[#2d3952] px-1.5 text-[10px] text-[#b7c5da]">{formatNumber(t.badge as number)}</span>
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
