import { Clock, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { BRANDS, CATEGORIES, SITE } from '@/lib/constants'

const CUSTOMER_LINKS = [
  { href: '/contact', label: 'تماس با ما' },
  { href: '/faq', label: 'سوالات متداول' },
  { href: '/shipping', label: 'رویهٔ ارسال' },
  { href: '/warranty', label: 'شرایط ضمانت' },
]

const COMPANY_LINKS = [
  { href: '/about', label: 'دربارهٔ ما' },
  { href: '/services', label: 'خدمات' },
  { href: '/blog', label: 'مجلهٔ آموزشی' },
  { href: '/terms', label: 'قوانین و مقررات' },
]

/** Server Component — بدون 'use client' تا JS اضافه به کلاینت ارسال نشود */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface-0">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* معرفی و تماس */}
          <div className="col-span-2">
            <Link href="/" className="text-xl font-black text-primary text-glow">
              {SITE.name}
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              تأمین، فروش و سرویس تخصصی ماشین‌های اداری. از مشاورهٔ پیش از خرید تا تأمین قطعات و
              تعمیرات، کنار شما هستیم.
            </p>

            <ul className="mt-5 space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                {SITE.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-primary" />
                <a href={`tel:${SITE.phoneLtr}`} className="transition-colors hover:text-primary">
                  {SITE.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-primary" />
                <a
                  href={`mailto:${SITE.email}`}
                  dir="ltr"
                  className="font-mono transition-colors hover:text-primary"
                >
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                {SITE.workingHours}
              </li>
            </ul>
          </div>

          {/* دسته‌بندی‌ها */}
          <div>
            <h3 className="text-sm font-bold text-foreground">دسته‌بندی‌ها</h3>
            <ul className="mt-4 space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/products?category=${c.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* راهنمای مشتریان */}
          <div>
            <h3 className="text-sm font-bold text-foreground">راهنمای مشتریان</h3>
            <ul className="mt-4 space-y-2">
              {CUSTOMER_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* شرکت */}
          <div>
            <h3 className="text-sm font-bold text-foreground">فروشگاه</h3>
            <ul className="mt-4 space-y-2">
              {COMPANY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* برندها */}
        <div className="mt-10 border-t border-border pt-6">
          <p className="mb-3 text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
            برندهای موجود
          </p>
          <div className="flex flex-wrap gap-2">
            {BRANDS.map((b) => (
              <Link
                key={b.slug}
                href={`/products?brand=${b.slug}`}
                dir="ltr"
                className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 font-mono text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
              >
                {b.displayName}
              </Link>
            ))}
          </div>
        </div>

        {/* نوار پایانی */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE.fullName}. تمامی حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-1 px-3 py-2">
            <ShieldCheck className="size-4 text-stock-in" />
            <span className="text-[11px] text-muted-foreground">نماد اعتماد الکترونیکی</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
