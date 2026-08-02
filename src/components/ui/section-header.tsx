import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  /** دکمه یا لینک کناری (مثلاً «همهٔ محصولات») */
  action?: React.ReactNode
  /** تگ عنوان — h1 برای صفحه، h2 برای بخش */
  as?: 'h1' | 'h2' | 'h3'
  align?: 'start' | 'center'
  className?: string
}

/**
 * هدر یکنواخت بخش‌ها و صفحات.
 * جایگزین تکرار text-2xl/3xl font-black در ده‌ها فایل.
 */
export function SectionHeader({
  title,
  description,
  action,
  as: Tag = 'h2',
  align = 'start',
  className,
}: SectionHeaderProps) {
  const isPageTitle = Tag === 'h1'

  return (
    <header
      className={cn(
        'mb-8 flex gap-4',
        align === 'center'
          ? 'flex-col items-center text-center'
          : 'flex-wrap items-end justify-between',
        className
      )}
    >
      <div className={cn(align === 'center' && 'max-w-2xl')}>
        <Tag
          className={cn(
            'font-black text-foreground',
            isPageTitle
              ? 'text-2xl md:text-3xl'
              : 'text-2xl md:text-3xl'
          )}
        >
          {title}
        </Tag>
        {description && (
          <p
            className={cn(
              'mt-2 text-sm leading-relaxed text-muted-foreground',
              align === 'start' && !action && 'max-w-2xl'
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
