'use client'

import { CreditCard, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { ENABLED_PAYMENT_METHODS, PAYMENT_METHODS, type PaymentMethod } from '@/lib/schemas'
import { cn } from '@/lib/utils'

interface PaymentOption {
  value: PaymentMethod
  label: string
  hint: string
  icon: LucideIcon
}

const OPTIONS: PaymentOption[] = [
  {
    value: 'online',
    label: 'پرداخت آنلاین',
    hint: 'انتقال امن به درگاه بانکی معتبر',
    icon: CreditCard,
  },
  {
    value: 'cod',
    label: 'پرداخت در محل',
    hint: 'فعلاً غیرفعال',
    icon: ShieldCheck,
  },
]

interface Props {
  /** خروجی register('paymentMethod') — اتصال به react-hook-form */
  registration: UseFormRegisterReturn
  error?: string
}

/**
 * انتخاب روش پرداخت.
 *
 * چرا fieldset/legend؟ گروه رادیو بدون آن، برای screen reader
 * فقط دو گزینهٔ بی‌ارتباط است و کاربر نمی‌فهمد چه چیزی را انتخاب
 * می‌کند.
 */
export function PaymentMethodField({ registration, error }: Props) {
  const errorId = 'paymentMethod-error'

  return (
    <fieldset
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-5 flex items-center gap-2">
        <CreditCard className="size-5 text-primary" aria-hidden="true" />
        <span className="text-lg font-bold text-foreground">روش پرداخت</span>
      </legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const disabled = !ENABLED_PAYMENT_METHODS.includes(option.value)
          const Icon = option.icon

          return (
            <div key={option.value} className={cn('relative', disabled && 'opacity-50 grayscale')}>
              <input
                {...registration}
                type="radio"
                id={`payment-${option.value}`}
                value={option.value}
                disabled={disabled}
                className="peer sr-only"
              />
              <label
                htmlFor={`payment-${option.value}`}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-surface-0/40 p-6 transition-all',
                  'peer-checked:border-primary peer-checked:bg-primary/10',
                  // مسیر فوکوس کیبورد — رادیو sr-only است پس باید روی label دیده شود
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                  disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-primary/40'
                )}
              >
                <Icon
                  className={cn(
                    'mb-2 size-8',
                    disabled ? 'text-muted-foreground' : 'text-primary'
                  )}
                  aria-hidden="true"
                />
                <span className="font-bold text-foreground">{option.label}</span>
                <span className="mt-1 text-center text-[11px] text-muted-foreground">
                  {option.hint}
                </span>
              </label>
            </div>
          )
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}

/** برای تست: تعداد گزینه‌ها با تعداد روش‌های تعریف‌شده یکی است */
export const PAYMENT_OPTION_COUNT = PAYMENT_METHODS.length
