'use client'

import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface AdminOperaTabItem<T extends string = string> {
  key: T
  label: string
  badge?: number
}

interface AdminOperaTabsProps<T extends string = string> {
  items: AdminOperaTabItem<T>[]
  value: T
  onValueChange: (key: T) => void
  className?: string
  useTabRole?: boolean
  'aria-label'?: string
  idPrefix?: string
}

/**
 * Fixed box for all tabs:
 * - Inactive box border #3b82f6 (like previous selected color)
 * - Active bg #60a5fa (another color) per latest request
 * - Eye-friendly blue, readable 13px
 */
export function AdminOperaTabs<T extends string = string>({
  items,
  value,
  onValueChange,
  className,
  useTabRole = false,
  'aria-label': ariaLabel = 'فیلتر',
  idPrefix = 'opera-panel',
}: AdminOperaTabsProps<T>) {
  const isTabRole = useTabRole

  return (
    <div role={isTabRole ? 'tablist' : 'group'} aria-label={ariaLabel} className={cn('flex flex-wrap gap-2.5', className)}>
      {items.map((item) => {
        const isActive = value === item.key
        const showBadge = item.badge !== undefined && item.badge !== null
        return (
          <button
            key={item.key}
            type="button"
            role={isTabRole ? 'tab' : undefined}
            aria-selected={isTabRole ? isActive : undefined}
            aria-pressed={!isTabRole ? isActive : undefined}
            aria-controls={isTabRole ? `${idPrefix}-${item.key}` : undefined}
            id={isTabRole ? `tab-${item.key}` : undefined}
            onClick={() => onValueChange(item.key)}
            className={cn(
              'h-10 min-w-[88px] rounded-full border px-5 text-[13px] font-bold leading-none tracking-wide transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#273552]',
              'hover:-translate-y-px',
              isActive
                ? 'bg-[#60a5fa] border-[#60a5fa] text-[#0f172a] shadow-[0_4px_14px_#60a5fa55]'
                : 'bg-transparent border-[#3b82f6] text-[#93c5fd] hover:bg-[#3b82f6]/10 hover:text-[#bfdbfe] hover:border-[#60a5fa]'
            )}
          >
            <span>{item.label}</span>
            {showBadge && <small className="ms-1.5 text-[9px] opacity-90">{formatNumber(item.badge as number)}</small>}
          </button>
        )
      })}
    </div>
  )
}
