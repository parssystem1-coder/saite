import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * ورودی متن با ظاهر «فرورفته» (inset) — نقطهٔ مقابل دکمهٔ برجسته.
 * این تضاد بصری، سلسله‌مراتب سه‌بعدی فرم را تقویت می‌کند.
 *
 * نکته: تایپ به‌جای interface خالی (که خطای لینت می‌داد) با type alias
 * تعریف شده است.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-border bg-input px-3.5 py-2 text-sm',
        'shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)]',
        'placeholder:text-muted-foreground/70',
        'transition-colors outline-none',
        'focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
