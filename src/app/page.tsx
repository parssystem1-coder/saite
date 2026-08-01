import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  Droplets,
  Headphones,
  Printer,
  ScanLine,
  Send,
  Truck,
  Wrench,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleTeasers } from '@/components/home/article-teasers'
import { BrandStrip } from '@/components/home/brand-strip'
import { CompatibilityFinder } from '@/components/home/compatibility-finder'
import { HomeProductGrid } from '@/components/home/home-product-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { getBestSellers, getCompatibleItems, getFeaturedProducts, getSupportedDeviceModels } from '@/lib/api'
import { CATEGORIES, SITE } from '@/lib/constants'
import type { Product } from '@/types/product'

export const metadata: Metadata = {
  description:
    'فروش و سرویس تخصصی پرینتر، اسکنر، دستگاه کپی، فکس، مواد مصرفی و قطعات یدکی با ضمانت اصالت کالا.',
}

const CATEGORY_ICONS = { Printer, ScanLine, Copy, Send, Droplets, Wrench } as const

const TRUST_ITEMS = [
  { icon: BadgeCheck, title: 'ضمانت اصالت کالا', desc: 'تمام کالاها اورجینال و دارای گارانتی' },
  { icon: Truck, title: 'ارسال سریع', desc: 'ارسال به سراسر کشور در کوتاه‌ترین زمان' },
  { icon: Headphones, title: 'مشاورهٔ تخصصی', desc: 'راهنمایی رایگان پیش از خرید' },
  { icon: Wrench, title: 'خدمات پس از فروش', desc: 'تعمیر و تأمین قطعات توسط تیم فنی' },
]

const SERVICES = [
  {
    icon: Wrench,
    title: 'تعمیر ماشین‌های اداری',
    desc: 'عیب‌یابی و تعمیر تخصصی پرینتر، اسکنر و دستگاه کپی در محل یا کارگاه.',
    href: '/services/repair',
  },
  {
    icon: Droplets,
    title: 'تأمین مواد مصرفی و قطعات',
    desc: 'تأمین تونر، کارتریج، درام و قطعات یدکی اورجینال برای تمام برندهای معتبر.',
    href: '/services/parts',
  },
  {
    icon: BadgeCheck,
    title: 'قرارداد سرویس دوره‌ای',
    desc: 'قرارداد نگهداری سالانه برای سازمان‌ها با اولویت پشتیبانی و قیمت ترجیحی.',
    href: '/services/contract',
  },
]

export default async function Home() {
  const [featured, bestSellers, devices] = await Promise.all([
    getFeaturedProducts(),
    getBestSellers(),
    getSupportedDeviceModels(),
  ])

  // نگاشت سازگاری از پیش ساخته می‌شود تا ویجت بدون رفت‌وبرگشت سرور کار کند
  const compatibilityMap: Record<string, Product[]> = {}
  for (const d of devices) {
    compatibilityMap[d.model] = await getCompatibleItems(d.model)
  }

  return (
    <div className="container mx-auto space-y-20 px-4 py-10">
      {/* ① بنر اصلی ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-linear-to-bl from-primary/12 via-surface-1 to-surface-0 px-6 py-16 shadow-depth-3 md:px-14 md:py-20">
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 size-96 rounded-full bg-primary/20 blur-[120px]"
        />
        <div className="relative z-10 max-w-2xl">
          <Badge variant="accent" className="mb-5">
            تأمین‌کنندهٔ تخصصی ماشین‌های اداری
          </Badge>
          <h1 className="text-4xl leading-tight font-black text-balance text-foreground md:text-6xl">
            تجهیزات اداری، <span className="text-primary text-glow">تأمین و سرویس</span> مطمئن
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            پرینتر، اسکنر، دستگاه کپی، فکس، مواد مصرفی و قطعات یدکی — همراه با مشاورهٔ تخصصی
            پیش از خرید و پشتیبانی فنی پس از آن.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/products">
                مشاهدهٔ محصولات
                <ArrowLeft />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">درخواست مشاوره</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ② ابزار یافتن قطعهٔ سازگار — عمداً بالاتر از محصولات */}
      <CompatibilityFinder devices={devices} compatibilityMap={compatibilityMap} />

      {/* ③ دسته‌بندی‌ها ──────────────────────────────────── */}
      <section>
        <header className="mb-8 text-center">
          <h2 className="text-2xl font-black text-foreground md:text-3xl">دسته‌بندی محصولات</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            آنچه نیاز دارید را از میان شش گروه اصلی انتخاب کنید
          </p>
        </header>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS]
            return (
              <Card3D key={cat.slug} maxTilt={7}>
                <Link
                  href={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center p-5 text-center"
                >
                  <div className="layer-lift-sm mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/12 transition-colors group-hover:bg-primary/20">
                    <Icon className="size-7 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{cat.name}</p>
                </Link>
              </Card3D>
            )
          })}
        </div>
      </section>

      {/* ④ نوار اعتماد ───────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className="surface-3d flex items-start gap-3 rounded-2xl p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12">
              <item.icon className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ⑤ پرفروش‌ترین‌ها ────────────────────────────────── */}
      <section>
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground md:text-3xl">پرفروش‌ترین‌ها</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              پرتقاضاترین کالاهای فروشگاه در ماه گذشته
            </p>
          </div>
          <Button variant="link" asChild>
            <Link href="/products?sort=best_selling">
              همهٔ محصولات
              <ArrowLeft />
            </Link>
          </Button>
        </header>
        <HomeProductGrid products={bestSellers.slice(0, 4)} />
      </section>

      {/* ⑥ برندها ────────────────────────────────────────── */}
      <BrandStrip />

      {/* ⑦ خدمات ─────────────────────────────────────────── */}
      <section>
        <header className="mb-8 text-center">
          <h2 className="text-2xl font-black text-foreground md:text-3xl">خدمات ما</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            فروش تنها بخشی از کار ماست — در نگهداری هم کنار شما هستیم
          </p>
        </header>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {SERVICES.map((s) => (
            <Card3D key={s.title} maxTilt={4}>
              <Link href={s.href} className="block p-7">
                <div className="layer-lift-sm mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/12">
                  <s.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                <span className="mt-4 inline-block text-xs font-bold text-primary">
                  اطلاعات بیشتر ←
                </span>
              </Link>
            </Card3D>
          ))}
        </div>
      </section>

      {/* ⑧ محصولات ویژه ─────────────────────────────────── */}
      <section>
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground md:text-3xl">پیشنهاد ویژه</h2>
            <p className="mt-2 text-sm text-muted-foreground">منتخب کارشناسان فنی ما</p>
          </div>
        </header>
        <HomeProductGrid products={featured.slice(0, 4)} />
      </section>

      {/* ⑨ مقالات ────────────────────────────────────────── */}
      <ArticleTeasers />

      {/* ⑩ فراخوان پایانی ───────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-linear-to-l from-primary/18 to-surface-1 p-10 text-center shadow-depth-3 md:p-14">
        <div
          aria-hidden="true"
          className="absolute -right-20 -bottom-20 size-72 rounded-full bg-primary/20 blur-[100px]"
        />
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-foreground md:text-3xl">
            در انتخاب دستگاه مناسب تردید دارید؟
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            کارشناسان ما بر اساس حجم کار و بودجهٔ شما، مناسب‌ترین گزینه را پیشنهاد می‌دهند.
            مشاوره کاملاً رایگان است.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/contact">دریافت مشاورهٔ رایگان</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <a href={`tel:${SITE.phoneLtr}`} dir="ltr">
                {SITE.phone}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
