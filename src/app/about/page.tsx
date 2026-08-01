import { Award, Headphones, PackageCheck, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'دربارهٔ ما',
  description:
    'معرفی فروشگاه، سابقهٔ فعالیت و مزیت‌های ما در تأمین و سرویس ماشین‌های اداری.',
}

const STATS = [
  { icon: Users, value: '۲٬۵۰۰+', label: 'مشتری سازمانی و خرد' },
  { icon: PackageCheck, value: '۷', label: 'برند معتبر جهانی' },
  { icon: Award, value: '۱۵ سال', label: 'سابقهٔ فعالیت تخصصی' },
  { icon: Headphones, value: '۲۴ ساعت', label: 'زمان پاسخ‌گویی' },
]

const VALUES = [
  {
    title: 'تخصص، نه صرفاً فروش',
    desc: 'ما دستگاهی را پیشنهاد می‌دهیم که با حجم کار و بودجهٔ شما بخواند — حتی اگر ارزان‌تر باشد.',
  },
  {
    title: 'تأمین پایدار مصرفی',
    desc: 'خرید دستگاه آغاز رابطه است. تونر، درام و قطعات را برای سال‌های بعد هم تأمین می‌کنیم.',
  },
  {
    title: 'پشتیبانی فنی واقعی',
    desc: 'تیم فنی ما دستگاه‌ها را می‌شناسد؛ پاسخ تلفنی می‌دهد و در صورت نیاز در محل حاضر می‌شود.',
  },
]

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <Breadcrumb className="mb-8" items={[{ label: 'خانه', href: '/' }, { label: 'دربارهٔ ما' }]} />

      <header className="mb-12 max-w-3xl">
        <h1 className="text-3xl font-black text-balance text-foreground md:text-4xl">
          تأمین‌کنندهٔ تخصصی ماشین‌های اداری
        </h1>
        <p className="mt-4 leading-loose text-muted-foreground">
          {SITE.fullName} از سال‌ها پیش در حوزهٔ تأمین، فروش و سرویس تجهیزات اداری فعالیت می‌کند.
          کار ما با فروش یک دستگاه تمام نمی‌شود؛ تأمین مواد مصرفی، قطعات یدکی و خدمات تعمیر،
          بخش اصلی رابطهٔ بلندمدت ما با مشتریان است.
        </p>
        <p className="mt-4 leading-loose text-muted-foreground">
          مشتریان ما از دفاتر کوچک تا سازمان‌های بزرگ را شامل می‌شوند و همین تنوع باعث شده
          کارشناسان ما با طیف گسترده‌ای از دستگاه‌ها و نیازها آشنا باشند.
        </p>
      </header>

      <section className="mb-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="surface-3d rounded-2xl p-6 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/12">
              <s.icon className="size-5 text-primary" />
            </div>
            <p className="text-xl font-black text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="mb-16">
        <h2 className="mb-8 text-2xl font-black text-foreground">چرا ما؟</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {VALUES.map((v) => (
            <Card3D key={v.title} maxTilt={4}>
              <div className="p-7">
                <h3 className="text-base font-bold text-foreground">{v.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-primary/25 bg-linear-to-l from-primary/15 to-surface-1 p-10 text-center">
        <h2 className="text-xl font-black text-foreground md:text-2xl">
          سؤالی دارید؟ با ما تماس بگیرید
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          کارشناسان ما آمادهٔ پاسخ‌گویی و مشاورهٔ رایگان هستند.
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/contact">تماس با ما</Link>
        </Button>
      </section>
    </div>
  )
}
