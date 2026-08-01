import { ArrowLeft, BadgeCheck, Droplets, Wrench } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'

export const metadata: Metadata = {
  title: 'خدمات',
  description:
    'تعمیر ماشین‌های اداری، تأمین قطعات یدکی و مواد مصرفی، و قرارداد سرویس دوره‌ای برای سازمان‌ها.',
}

const SERVICES = [
  {
    icon: Wrench,
    title: 'تعمیر ماشین‌های اداری',
    desc: 'عیب‌یابی و تعمیر تخصصی پرینتر، اسکنر، دستگاه کپی و فکس؛ در محل شما یا در کارگاه فنی ما.',
    items: [
      'تعمیر برد و منبع تغذیه',
      'رفع مشکل کاغذکشی و گیر کردن کاغذ',
      'سرویس یونیت فیوزینگ و درام',
      'تنظیم کیفیت چاپ و کالیبراسیون',
    ],
  },
  {
    icon: Droplets,
    title: 'تأمین قطعات و مواد مصرفی',
    desc: 'تأمین تونر، کارتریج، درام، غلتک و قطعات یدکی اورجینال برای تمام برندهای معتبر.',
    items: [
      'تونر و کارتریج اورجینال',
      'درام یونیت و دولوپر',
      'غلتک کاغذکش و تسمهٔ انتقال',
      'تأمین سفارشی قطعات کمیاب',
    ],
  },
  {
    icon: BadgeCheck,
    title: 'قرارداد سرویس دوره‌ای',
    desc: 'قرارداد نگهداری سالانه برای سازمان‌ها؛ با اولویت پشتیبانی، بازدید دوره‌ای و قیمت ترجیحی.',
    items: [
      'بازدید و سرویس دوره‌ای',
      'اولویت در زمان پاسخ‌گویی',
      'تخفیف روی قطعات و مصرفی',
      'گزارش وضعیت تجهیزات',
    ],
  },
]

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
        {SERVICES.map((s) => (
          <Card3D key={s.title} maxTilt={4}>
            <div className="flex h-full flex-col p-7">
              <div className="layer-lift-sm mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/12">
                <s.icon className="size-6 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {s.items.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
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
