import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface Crumb {
  label: string
  href?: string
}

/**
 * مسیر راهنما (Breadcrumb) با جهت‌دهی صحیح RTL.
 * جداکنندهٔ ChevronLeft انتخاب شده چون در چیدمان راست‌به‌چپ،
 * حرکت رو به جلو به سمت چپ است.
 */
export function Breadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="مسیر صفحه" className={cn('flex items-center gap-1.5 text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className="font-medium text-foreground"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronLeft className="size-3.5 text-muted-foreground/50" aria-hidden="true" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
