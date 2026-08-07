import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, ExternalLink, MessageCircle, Rocket, ShieldCheck, Users } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { ADMIN_NAV, flattenAdminNav } from '@/lib/admin/nav'

export const metadata: Metadata = {
  title: 'راهنمای پنل مدیریت',
  description: 'راهنمای کار با پنل مدیریت و مسیرهای فعال',
  robots: { index: false, follow: false, nocache: true },
}

const QUICK_START = [
  {
    icon: Rocket,
    title: 'شروع سریع',
    body: 'اولین کار پس از راه‌اندازی: در «تنظیمات فاکتور» مشخصات حقوقی و در «تنظیمات پرداخت» درگاه را وارد کنید.',
    href: '/admin/finance/invoice-settings',
  },
  {
    icon: Users,
    title: 'افزودن مشتری',
    body: 'صفحهٔ «مشتریان» را باز کنید. برای CRM، سگمنت‌بندی خودکار طبق تاریخچهٔ خرید انجام می‌شود.',
    href: '/admin/customers',
  },
  {
    icon: ShieldCheck,
    title: 'امنیت',
    body: 'رمز عبور را در فایل .env تنظیم و برای ابطال نشست‌های قدیمی، مقدار ADMIN_SESSION_VERSION را افزایش دهید.',
  },
  {
    icon: MessageCircle,
    title: 'ارتباط با مشتری',
    body: 'صندوق «درخواست‌های استعلام» لیدهای فرم تماس و واتساپ را جمع می‌کند؛ ارجاع، پیگیری و یادداشت داخلی ممکن است.',
    href: '/admin/communications/inquiries',
  },
]

export default function HelpPage() {
  const totalRoutes = flattenAdminNav().length

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="راهنما"
        description="شروع سریع، اصول امنیتی و نقشهٔ کامل ماژول‌های پنل"
      />

      <section className="surface-3d rounded-2xl p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Rocket className="size-5 text-primary" aria-hidden />
          شروع سریع
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {QUICK_START.map((q) => {
            const Icon = q.icon
            return (
              <div key={q.title} className="rounded-xl border border-border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/12 text-primary" aria-hidden>
                    <Icon className="size-4" />
                  </span>
                  <h4 className="text-sm font-semibold">{q.title}</h4>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{q.body}</p>
                {q.href && (
                  <Link
                    href={q.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    برو به بخش
                    <ExternalLink className="size-3" aria-hidden />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="surface-3d rounded-2xl p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <BookOpen className="size-5 text-primary" aria-hidden />
          نقشهٔ ماژول‌ها ({totalRoutes.toLocaleString('fa-IR')} صفحه)
        </h3>
        <div className="space-y-5">
          {ADMIN_NAV.map((group) => (
            <div key={group.id}>
              <h4 className="mb-2 text-sm font-semibold text-primary">{group.label}</h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {(group.children ?? []).map((leaf) => (
                  <li key={leaf.id}>
                    <Link
                      href={leaf.href}
                      className="block rounded-lg border border-border p-3 text-xs transition hover:border-primary/50 hover:bg-primary/5"
                    >
                      <div className="mb-1 font-medium text-foreground">{leaf.label}</div>
                      <div className="text-muted-foreground">{leaf.description}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-3d rounded-2xl p-5">
        <h3 className="mb-3 text-base font-semibold">پشتیبانی فنی</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          سؤالی دربارهٔ عملکرد پنل دارید؟ گزارش باگ یا پیشنهاد را در مخزن GitHub پروژه ثبت کنید. کدهای منبع همه ماژول‌ها قابل بررسی است و
          الگوی <code className="rounded bg-muted px-1.5 py-0.5 text-xs">mock-adapter</code> برای اتصال بک‌اند واقعی طراحی شده است.
        </p>
      </section>
    </div>
  )
}
