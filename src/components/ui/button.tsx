'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * دکمهٔ سه‌بعدی.
 *
 * تغییر مهم نسبت به نسخهٔ قبل: wrapper اضافی <motion.div> حذف شد.
 * آن wrapper باعث می‌شد کلاس w-full روی دکمه بی‌اثر بماند (چون والد
 * inline-block باقی می‌ماند). حالا حس سه‌بعدی با «ضلع پایین» ساخته
 * می‌شود که با فشردن دکمه جمع می‌شود — دقیقاً مثل یک کلید فیزیکی.
 */
const buttonVariants = cva(
  [
    'btn-3d relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-bold transition-all outline-none',
    'focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:size-[1.1em] [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-gradient-to-b from-primary-bright to-primary text-primary-foreground',
          'shadow-[0_4px_0_0_hsl(var(--primary-deep)),0_6px_16px_hsl(var(--primary)/0.35)]',
          'hover:shadow-[0_4px_0_0_hsl(var(--primary-deep)),0_8px_24px_hsl(var(--primary)/0.5)]',
          'active:shadow-[0_1px_0_0_hsl(var(--primary-deep)),0_2px_8px_hsl(var(--primary)/0.3)]',
        ],
        secondary: [
          'bg-gradient-to-b from-surface-3 to-surface-2 text-secondary-foreground',
          'border border-border',
          'shadow-[0_4px_0_0_hsl(var(--surface-0)),0_6px_14px_hsl(0_0%_0%/0.4)]',
          'hover:border-primary/40 hover:text-foreground',
          'active:shadow-[0_1px_0_0_hsl(var(--surface-0))]',
        ],
        outline: [
          'border-2 border-primary/35 bg-primary/5 text-foreground',
          'shadow-[0_3px_0_0_hsl(var(--primary)/0.2)]',
          'hover:border-primary/70 hover:bg-primary/12',
          'active:shadow-[0_1px_0_0_hsl(var(--primary)/0.2)]',
        ],
        destructive: [
          'bg-gradient-to-b from-destructive to-destructive/85 text-destructive-foreground',
          'shadow-[0_4px_0_0_hsl(0_72%_38%),0_6px_16px_hsl(var(--destructive)/0.3)]',
          'active:shadow-[0_1px_0_0_hsl(0_72%_38%)]',
        ],
        ghost: 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-lg px-3.5 text-xs',
        default: 'h-11 rounded-xl px-6 text-sm',
        lg: 'h-14 rounded-2xl px-8 text-base',
        icon: 'size-11 rounded-xl',
        'icon-sm': 'size-9 rounded-lg',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
