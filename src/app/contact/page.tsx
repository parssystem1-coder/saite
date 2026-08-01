import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ContactForm } from '@/components/contact/contact-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'تماس با ما',
  description:
    'راه‌های ارتباطی، آدرس، ساعات کاری و فرم درخواست مشاوره و استعلام قیمت تجهیزات اداری.',
}

const CHANNELS = [
  { icon: Phone, label: 'تلفن فروش', value: SITE.phone, href: `tel:${SITE.phoneLtr}`, ltr: true },
  { icon: MessageCircle, label: 'واتساپ', value: SITE.whatsapp, href: '#', ltr: true },
  { icon: Mail, label: 'ایمیل', value: SITE.email, href: `mailto:${SITE.email}`, ltr: true },
  { icon: Clock, label: 'ساعات کاری', value: SITE.workingHours, ltr: false },
]

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb className="mb-8" items={[{ label: 'خانه', href: '/' }, { label: 'تماس با ما' }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-black text-foreground">تماس با ما</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          برای مشاورهٔ خرید، استعلام قیمت کالاهای سازمانی یا درخواست تعمیر، از راه‌های زیر با ما
          در ارتباط باشید. کارشناسان ما در ساعات کاری پاسخگوی شما هستند.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        {/* اطلاعات تماس */}
        <div className="space-y-4">
          {CHANNELS.map((c) => {
            const content = (
              <div className="surface-3d flex items-start gap-3 rounded-2xl p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                  <c.icon className="size-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p
                    dir={c.ltr ? 'ltr' : undefined}
                    className={`mt-1 text-sm font-bold text-foreground ${c.ltr ? 'text-right font-mono' : ''}`}
                  >
                    {c.value}
                  </p>
                </div>
              </div>
            )
            return c.href ? (
              <a key={c.label} href={c.href} className="block">
                {content}
              </a>
            ) : (
              <div key={c.label}>{content}</div>
            )
          })}

          <div className="surface-3d rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
                <MapPin className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">نشانی</p>
                <p className="mt-1 text-sm leading-relaxed font-bold text-foreground">
                  {SITE.address}
                </p>
              </div>
            </div>
            {/* جای‌گاه نقشه — در فاز بعد با نقشهٔ واقعی جایگزین می‌شود */}
            <div className="mt-4 flex h-44 items-center justify-center rounded-xl border border-dashed border-border bg-surface-0/50">
              <p className="text-xs text-muted-foreground">نقشهٔ موقعیت فروشگاه</p>
            </div>
          </div>
        </div>

        {/* فرم — ContactForm از useSearchParams استفاده می‌کند و
            برای پیش‌رندر استاتیک نیازمند مرز Suspense است */}
        <Suspense fallback={<Skeleton className="h-[42rem] w-full rounded-2xl" />}>
          <ContactForm />
        </Suspense>
      </div>
    </div>
  )
}
