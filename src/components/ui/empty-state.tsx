import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/** حالت خالی — برای نتیجهٔ جستجوی بی‌حاصل، سبد خالی و فهرست‌های تهی */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className
      )}
    >
      <div className="relative mb-5">
        <div
          className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
          aria-hidden="true"
        />
        <div className="surface-3d relative flex size-20 items-center justify-center rounded-2xl">
          <Icon className="size-9 text-primary" aria-hidden="true" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
