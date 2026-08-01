import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/15 text-primary',
        secondary: 'border-border bg-surface-2 text-secondary-foreground',
        outline: 'border-border bg-transparent text-muted-foreground',
        accent: 'border-accent/30 bg-accent/15 text-accent',
        destructive: 'border-destructive/30 bg-destructive/15 text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
