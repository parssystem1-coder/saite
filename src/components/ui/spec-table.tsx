import { TechText } from '@/components/ui/tech-text'
import { cn } from '@/lib/utils'
import type { Spec } from '@/types/product'

interface SpecTableProps {
  specs: Spec[]
  className?: string
}

/**
 * جدول مشخصات فنی با گروه‌بندی خودکار.
 *
 * مقادیر دارای پرچم isTechnical با dir="ltr" و فونت mono رندر می‌شوند
 * تا «600 × 600 dpi» یا «USB 2.0» در متن راست‌به‌چپ به‌هم نریزد.
 */
export function SpecTable({ specs, className }: SpecTableProps) {
  if (specs.length === 0) return null

  const groups = specs.reduce<Record<string, Spec[]>>((acc, spec) => {
    const g = spec.group ?? 'عمومی'
    ;(acc[g] ??= []).push(spec)
    return acc
  }, {})

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groups).map(([groupName, groupSpecs]) => (
        <section key={groupName}>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
            <span className="h-px flex-1 bg-linear-to-l from-primary/40 to-transparent" />
            {groupName}
            <span className="h-px flex-1 bg-linear-to-r from-primary/40 to-transparent" />
          </h4>

          <dl className="overflow-hidden rounded-xl border border-border">
            {groupSpecs.map((spec, i) => (
              <div
                key={spec.key}
                className={cn(
                  'grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-2.5 text-sm',
                  i % 2 === 0 ? 'bg-surface-1' : 'bg-surface-0/40'
                )}
              >
                <dt className="text-muted-foreground">{spec.key}</dt>
                <dd className="font-medium text-foreground">
                  {spec.isTechnical ? <TechText>{spec.value}</TechText> : spec.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
