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
 * Opera Reference Filter - exact from reference.css
 * .filter 36px 78px border #b8d6ff2b radius 19px bg #536a9c text #f1f5ff
 * .filter.active bg #27d4ee border #79e7f5 text #09263b shadow
 * badge zero displayable
 * Uses aria-pressed when filtering (no real tabpanel)
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
    <div
      role={isTabRole ? 'tablist' : 'group'}
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-2.5', className)} // filters gap 10px from reference
    >
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
              'h-9 min-w-[78px] rounded-full border px-4 text-[11px] font-extrabold transition-all', // 36px 78px 19px from reference
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#27d4ee] focus-visible:ring-offset-2',
              'hover:-translate-y-px',
              isActive
                ? 'bg-[#27d4ee] border-[#79e7f5] text-[#09263b] shadow-[0_6px_15px_#27d4ee47,inset_0_1px_0_#ffffff66]'
                : 'bg-[#536a9c] border-[#b8d6ff2b] text-[#f1f5ff] shadow-[inset_0_1px_0_#ffffff2e,0_5px_12px_#07122733] hover:brightness-[1.12]'
            )}
          >
            <span>{item.label}</span>
            {showBadge && (
              <small className="ms-1.5 text-[9px] opacity-90">{formatNumber(item.badge as number)}</small>
            )}
          </button>
        )
      })}
    </div>
  )
}
