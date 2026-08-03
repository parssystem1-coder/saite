import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { SERVICE_DETAILS } from '@/lib/services-data'

export const metadata: Metadata = {
  title: 'خدمات',
  description:
    'تعمیر ماشین‌های اداری، تأمین قطعات یدکی و مواد مصرفی، و قرارداد سرویس دوره‌ای برای سازمان‌ها.',
}

/** حداکثر موارد نمایشی روی کارت — بقیه در صفحهٔ خدمت */
const MAX_OFFERINGS_ON_CARD = 4

/**
 * فهرست خدمات.
 *
 * داده از `SERVICE_DETAILS` می‌آید — پیش از این این صفحه و صفحهٔ
 * اصلی هرکدام آرایهٔ `SERVICES` جداگانه داشتند و کارت‌ها به صفحهٔ
 * جزئیات خدمت هم لینک نمی‌شدند.
 */
export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb className="mb-8" items={[{ label: 'خانه', href: '/' }, { label: 'خدمات' }]} />

      <header className="mb-12 max-w-2xl">
        <h1 className="text-3xl font-black text-foreground md:text-4xl">خدمات ما</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          فروش تنها بخشی از کار ماست. تیم فنی ما در نگهداری، تعمیر و تأمین قطعات تجهیزات اداری
          شما در تمام طول عمر دستگاه همراهتان است.
        </p>
      </header>

      <div className="mb-16 grid gap-6 lg:grid-cols-3">
        {SERVICE_DETAILS.map((service) => (
          <Card3D key={service.slug} maxTilt={4}>
            <Link href={`/services/${service.slug}`} className="flex h-full flex-col p-7">
              <div className="layer-lift-sm mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/12">
                <service.icon className="size-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{service.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
              <ul className="mt-5 flex-1 space-y-2">
                {service.offerings.slice(0, MAX_OFFERINGS_ON_CARD).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-primary"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <span className="mt-5 text-xs font-bold text-primary">جزئیات این خدمت ←</span>
            </Link>
          </Card3D>
        ))}
      </div>

      <section className="rounded-3xl border border-primary/25 bg-linear-to-l from-primary/15 to-surface-1 p-10 text-center">
        <h2 className="text-xl font-black text-foreground md:text-2xl">
          نیاز به تعمیر یا تأمین قطعه دارید؟
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          مدل دستگاه و شرح مشکل را برای ما بفرستید تا کارشناسان ما بررسی کنند و با شما تماس بگیرند.
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/contact">
            ثبت درخواست
            <ArrowLeft />
          </Link>
        </Button>
      </section>
    </div>
  )
}
