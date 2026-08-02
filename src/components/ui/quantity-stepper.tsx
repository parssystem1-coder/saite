'use client'

import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
  /** برچسب دسترس‌پذیری برای کل کنترل */
  'aria-label'?: string
}

/**
 * کنترل تعداد — مشترک بین سبد خرید و جعبهٔ خرید صفحهٔ محصول.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  className,
  'aria-label': ariaLabel = 'تعداد',
}: QuantityStepperProps) {
  const atMin = value <= min
  const atMax = max !== undefined && value >= max

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-xl border border-border bg-surface-0/60 p-1',
        className
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={atMin}
        aria-label="کاهش تعداد"
      >
        <Minus />
      </Button>
      <span
        aria-live="polite"
        className="w-9 text-center text-sm font-bold text-foreground"
      >
        {formatNumber(value)}
      </span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
        disabled={atMax}
        aria-label="افزایش تعداد"
      >
        <Plus />
      </Button>
    </div>
  )
}
