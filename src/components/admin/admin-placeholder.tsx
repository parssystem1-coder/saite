import { Construction, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  description: string
  icon: LucideIcon
  planned: string[]
}

/**
 * صفحهٔ نگهدارندهٔ بخش‌هایی که هنوز به بک‌اند وصل نشده‌اند.
 * سایدبار از layout می‌آید — اینجا فقط محتوای main است.
 */
export function AdminPlaceholder({ title, description, icon: Icon, planned }: Props) {
  return (
    <div>
      <AdminPageHeader title={title} description={description} />

      <div className="surface-3d rounded-2xl p-8 text-center md:p-10">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/12">
          <Icon className="size-8 text-primary" aria-hidden />
        </div>

        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-stock-low/30 bg-stock-low/10 px-3 py-1 text-xs font-bold text-stock-low">
          <Construction className="size-3.5" aria-hidden />
          در انتظار اتصال بک‌اند
        </div>

        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          این بخش به‌صورت ماژولار آماده شده و پس از اتصال API/دیتابیس فعال می‌شود. ساختار منو و
          مسیرها از الان ثابت است.
        </p>

        {planned.length > 0 && (
          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-right">
            {planned.map((p) => (
              <li
                key={p}
                className="flex items-start gap-2 rounded-xl border border-border bg-surface-2/50 p-3 text-xs text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {p}
              </li>
            ))}
          </ul>
        )}

        <Button variant="outline" className="mt-8" asChild>
          <Link href="/admin">بازگشت به داشبورد</Link>
        </Button>
      </div>
    </div>
  )
}
