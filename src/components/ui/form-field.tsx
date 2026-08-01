import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  id: string
  label: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * پوشش استاندارد فیلد فرم.
 *
 * سه الزام دسترس‌پذیری را یک‌جا حل می‌کند:
 *  - اتصال label به ورودی از طریق htmlFor/id
 *  - اعلام خطا با role="alert" تا screen reader بلافاصله بخواند
 *  - اتصال متن خطا به ورودی با aria-describedby
 */
export function FormField({ id, label, error, hint, required, className, children }: Props) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {hint && !error && (
        <p id={hintId} className="text-[11px] text-muted-foreground/80">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

/** ویژگی‌های ARIA متناسب با وضعیت خطا — کنار register() استفاده می‌شود */
export function fieldAria(id: string, hasError: boolean, hasHint = false) {
  return {
    id,
    'aria-invalid': hasError || undefined,
    'aria-describedby': hasError ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  }
}
