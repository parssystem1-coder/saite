import { Construction, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'

interface Props {
  title: string
  description: string
  icon: LucideIcon
  planned: string[]
}

/**
 * صفحهٔ نگهدارندهٔ بخش‌های پنل مدیریت که هنوز پیاده‌سازی نشده‌اند.
 *
 * چرا به‌جای حذف لینک، صفحهٔ صریح می‌سازیم؟ چون منوی ادمین نقشهٔ راه
 * محصول را نشان می‌دهد. صفحهٔ ۴۰۴ باعث می‌شود کاربر فکر کند چیزی خراب
 * است؛ این صفحه شفاف می‌گوید که بخش در انتظار اتصال بک‌اند است.
 */
export function AdminPlaceholder({ title, description, icon: Icon, planned }: Props) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col gap-8 lg:flex-row">
        <AdminSidebar />

        <main className="flex-1">
          <header className="mb-8">
            <h1 className="text-2xl font-black text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </header>

          <div className="surface-3d rounded-2xl p-10 text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/12">
              <Icon className="size-8 text-primary" />
            </div>

            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-stock-low/30 bg-stock-low/10 px-3 py-1 text-xs font-bold text-stock-low">
              <Construction className="size-3.5" />
              در انتظار اتصال بک‌اند
            </div>

            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              این بخش نیازمند پایگاه داده و احراز هویت سمت سرور است و در فاز بک‌اند فعال می‌شود.
            </p>

            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-right">
              {planned.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2 rounded-xl border border-border bg-surface-0/50 p-3 text-xs text-muted-foreground"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                  {p}
                </li>
              ))}
            </ul>

            <Button variant="outline" className="mt-8" asChild>
              <Link href="/admin">بازگشت به داشبورد</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
