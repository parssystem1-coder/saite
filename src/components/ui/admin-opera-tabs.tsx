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
  /** برای سازگاری با Tabs قدیمی؛ اگر true باشد از role=tab استفاده می‌کند */
  useTabRole?: boolean
  'aria-label'?: string
  idPrefix?: string
}

/**
 * کنترل فیلتر Opera-style: All | Updates | Enabled | Disabled
 * - جدا از هم، با فاصله gap-2.5
 * - active: cyan/blue (accent), border نرم, shadow
 * - hover: -translate-y-px, border-accent/40
 * - focus: ring-accent
 * - badge تعداد حتی صفر قابل نمایش
 *
 * اگر فقط داده را فیلتر می‌کند و tab panel واقعی ندارد، از aria-pressed استفاده می‌کند
 * (مطابق الزامات دسترسی‌پذیری).
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
      className={cn('flex flex-wrap gap-2.5', className)}
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
              'h-9 min-w-[78px] rounded-full border px-4 text-xs font-bold transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              'hover:-translate-y-px focus-visible:translate-y-0',
              isActive
                ? 'border-accent bg-accent text-accent-foreground shadow-[0_5px_14px_hsl(var(--accent)/0.25)]'
                : 'border-border bg-surface-1 text-foreground hover:border-accent/40 hover:bg-surface-2'
            )}
          >
            <span>{item.label}</span>
            {showBadge && (
              <span className="ms-1.5 rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] opacity-90">
                {formatNumber(item.badge as number)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
