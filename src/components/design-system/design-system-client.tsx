'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Copy,
  Droplets,
  LayoutGrid,
  LogOut,
  Package,
  PackageSearch,
  Printer,
  ScanLine,
  Send,
  Settings,
  User,
  Wrench,
} from 'lucide-react'
import * as React from 'react'
import { ProductGrid } from '@/components/products/product-grid'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Menu3D, Menu3DItem } from '@/components/ui/menu-3d'
import { PriceDisplay } from '@/components/ui/price-display'
import { ProductCard } from '@/components/ui/product-card'
import { SpecTable } from '@/components/ui/spec-table'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { getProducts } from '@/lib/api'
import { BRANDS, CATEGORIES, STOCK_STATUS_MAP } from '@/lib/constants'
import type { StockStatus } from '@/types/product'

const CATEGORY_ICONS = {
  Printer,
  ScanLine,
  Copy,
  Send,
  Droplets,
  Wrench,
} as const

const SAMPLE_SLUGS = [
  'canon-i-sensys-lbp-2900',
  'konica-minolta-bizhub-266',
  'epson-ecotank-l3250',
  'konica-minolta-bizhub-227-refurb',
] as const

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5">
      <header className="border-b border-border pb-3">
        <h2 className="text-xl font-black text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  )
}

/**
 * نمایشگاه سیستم طراحی.
 * داده از api می‌آید — نه import مستقیم mock-data.
 */
export function DesignSystemClient() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  })

  const sampleProducts = React.useMemo(() => {
    if (!products) return []
    return SAMPLE_SLUGS.map((slug) => products.find((p) => p.slug === slug)).filter(
      (p): p is NonNullable<typeof p> => Boolean(p)
    )
  }, [products])

  const surfaces = [
    { name: 'surface-0', cls: 'bg-surface-0', note: 'پس‌زمینهٔ اصلی' },
    { name: 'surface-1', cls: 'bg-surface-1', note: 'کارت عادی' },
    { name: 'surface-2', cls: 'bg-surface-2', note: 'کارت hover' },
    { name: 'surface-3', cls: 'bg-surface-3', note: 'مودال / منو' },
  ]

  const brandColors = [
    { name: 'primary', cls: 'bg-primary', note: 'بنفش نئون' },
    { name: 'primary-bright', cls: 'bg-primary-bright', note: 'لبهٔ نوری' },
    { name: 'primary-deep', cls: 'bg-primary-deep', note: 'ضلع/سایه' },
    { name: 'accent', cls: 'bg-accent', note: 'فیروزه‌ای مکمل' },
  ]

  const depths = ['shadow-depth-1', 'shadow-depth-2', 'shadow-depth-3', 'shadow-depth-4']

  return (
    <div className="container mx-auto max-w-6xl space-y-16 px-4 py-12">
      <header className="space-y-3">
        <Badge variant="accent">مرجع داخلی</Badge>
        <h1 className="text-4xl font-black text-foreground">
          سیستم <span className="text-primary text-glow">طراحی</span>
        </h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">
          مرجع بصری پروژه: توکن‌های رنگ، عمق سه‌بعدی، تایپوگرافی فارسی و کامپوننت‌های پایهٔ
          دامنهٔ ماشین‌های اداری. این صفحه ایندکس نمی‌شود.
        </p>
      </header>

      <Section title="۱. سطوح و عمق" subtitle="چهار لایه روشنایی که مبنای حس سه‌بعدی است">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {surfaces.map((s) => (
            <div key={s.name} className="surface-3d rounded-xl p-4">
              <div className={`${s.cls} mb-3 h-16 rounded-lg border border-border`} />
              <TechText className="text-xs font-bold text-foreground">{s.name}</TechText>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="۲. رنگ برند" subtitle="بنفش نئون در سه پله برای ساخت گرادیان و لبه">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {brandColors.map((c) => (
            <div key={c.name} className="surface-3d rounded-xl p-4">
              <div className={`${c.cls} mb-3 h-16 rounded-lg shadow-glow-sm`} />
              <TechText className="text-xs font-bold text-foreground">{c.name}</TechText>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{c.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="۳. مقیاس عمق" subtitle="سایه‌های لایه‌ای — عمق از نور می‌آید، نه از چرخش">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {depths.map((d, i) => (
            <div
              key={d}
              className={`flex h-24 items-center justify-center rounded-xl border border-border bg-surface-1 ${d}`}
            >
              <TechText className="text-xs text-muted-foreground">depth-{i + 1}</TechText>
            </div>
          ))}
        </div>
      </Section>

      <Section title="۴. تایپوگرافی فارسی" subtitle="قاعدهٔ کلیدی: قیمت فارسی، شناسهٔ فنی لاتین">
        <div className="surface-3d space-y-4 rounded-2xl p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-stock-in/25 bg-stock-in/5 p-4">
              <p className="mb-2 text-xs font-bold text-stock-in">✓ درست</p>
              <p className="text-sm text-muted-foreground">
                مدل: <TechText className="font-bold text-foreground">LBP-2900</TechText>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                سرعت: <TechText className="text-foreground">12 ppm</TechText>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                قیمت: <span className="font-bold text-foreground">۴,۸۵۰,۰۰۰ تومان</span>
              </p>
            </div>
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
              <p className="mb-2 text-xs font-bold text-destructive">✗ غلط</p>
              <p className="text-sm text-muted-foreground">
                مدل: <span className="font-bold">LBP-۲۹۰۰</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">سرعت: ۱۲ ppm</p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                فارسی‌سازی شناسهٔ فنی، آن را غیرقابل جستجو می‌کند.
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-3xl font-black text-foreground">وزیرمتن سیاه — عنوان اصلی</p>
            <p className="text-xl font-bold text-foreground">وزیرمتن ضخیم — عنوان بخش</p>
            <p className="text-base text-foreground">وزیرمتن معمولی — متن بدنه</p>
            <p className="text-sm text-muted-foreground">وزیرمتن کم‌رنگ — توضیحات فرعی</p>
          </div>
        </div>
      </Section>

      <Section title="۵. دکمهٔ سه‌بعدی" subtitle="ضلع پایین با فشردن جمع می‌شود — مثل کلید فیزیکی">
        <div className="surface-3d space-y-5 rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>پیش‌فرض</Button>
            <Button variant="secondary">ثانویه</Button>
            <Button variant="outline">خطی</Button>
            <Button variant="destructive">حذف</Button>
            <Button variant="ghost">شبح</Button>
            <Button variant="link">لینک</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <Button size="sm">کوچک</Button>
            <Button size="default">متوسط</Button>
            <Button size="lg">بزرگ</Button>
            <Button size="icon" aria-label="تنظیمات">
              <Settings />
            </Button>
            <Button disabled>غیرفعال</Button>
          </div>
          <div className="border-t border-border pt-5">
            <p className="mb-2 text-xs text-muted-foreground">تست تمام‌عرض:</p>
            <Button className="w-full">دکمهٔ تمام‌عرض</Button>
          </div>
        </div>
      </Section>

      <Section
        title="۶. منوی سه‌بعدی"
        subtitle="باز شدن با چرخش روی محور X از لبهٔ بالا — روی «باز کردن منو» کلیک کنید"
      >
        <div className="surface-3d flex flex-wrap items-center gap-6 rounded-2xl p-6">
          <Menu3D
            trigger={
              <span className="btn-3d inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-gradient-to-b from-surface-3 to-surface-2 px-6 text-sm font-bold text-foreground shadow-depth-2">
                <User className="size-4" />
                باز کردن منو
              </span>
            }
          >
            <Menu3DItem>
              <LayoutGrid className="size-4 text-primary" />
              داشبورد
            </Menu3DItem>
            <Menu3DItem>
              <Package className="size-4 text-primary" />
              سفارش‌های من
            </Menu3DItem>
            <Menu3DItem>
              <Settings className="size-4 text-primary" />
              تنظیمات حساب
            </Menu3DItem>
            <div className="my-1 h-px bg-border" />
            <Menu3DItem className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="size-4" />
              خروج
            </Menu3DItem>
          </Menu3D>
          <p className="text-xs text-muted-foreground">
            بستن با کلید Escape یا کلیک بیرون از پنل نیز کار می‌کند.
          </p>
        </div>
      </Section>

      <Section
        title="۷. وضعیت موجودی"
        subtitle="چهار حالت دامنه — «تماس بگیرید» مخصوص کالاهای استعلامی B2B"
      >
        <div className="surface-3d flex flex-wrap gap-3 rounded-2xl p-6">
          {(Object.keys(STOCK_STATUS_MAP) as StockStatus[]).map((s) => (
            <StockBadge key={s} status={s} />
          ))}
        </div>
      </Section>

      <Section title="۸. نمایش قیمت" subtitle="پشتیبانی از قیمت ثابت، تخفیف‌دار و استعلامی">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-3d rounded-2xl p-6">
            <p className="mb-3 text-xs text-muted-foreground">قیمت ساده</p>
            <PriceDisplay priceType="fixed" price={4850000} size="lg" />
          </div>
          <div className="surface-3d rounded-2xl p-6">
            <p className="mb-3 text-xs text-muted-foreground">با تخفیف واقعی</p>
            <PriceDisplay priceType="fixed" price={4850000} compareAtPrice={5300000} size="lg" />
          </div>
          <div className="surface-3d rounded-2xl p-6">
            <p className="mb-3 text-xs text-muted-foreground">استعلامی (B2B)</p>
            <PriceDisplay priceType="quote_only" size="lg" />
          </div>
        </div>
      </Section>

      <Section title="۹. ورودی فرم" subtitle="ظاهر فرورفته — نقطهٔ مقابل دکمهٔ برجسته">
        <div className="surface-3d grid gap-4 rounded-2xl p-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="ds-name" className="text-xs font-bold text-muted-foreground">
              نام دستگاه
            </label>
            <Input id="ds-name" placeholder="مثلاً: پرینتر لیزری کانن" />
          </div>
          <div className="space-y-2">
            <label htmlFor="ds-model" className="text-xs font-bold text-muted-foreground">
              شمارهٔ مدل
            </label>
            <Input id="ds-model" dir="ltr" className="font-mono" placeholder="LBP-2900" />
          </div>
        </div>
      </Section>

      <Section title="۱۰. دسته‌بندی‌های دامنه" subtitle="شش دستهٔ اصلی فروشگاه">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.icon as keyof typeof CATEGORY_ICONS]
            return (
              <Card3D key={cat.slug} maxTilt={4}>
                <div className="flex flex-col items-center p-4 text-center">
                  <div className="layer-lift-sm mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/12">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">{cat.name}</p>
                </div>
              </Card3D>
            )
          })}
        </div>
      </Section>

      <Section title="۱۱. برندها" subtitle="نام لاتین همیشه با dir=ltr">
        <div className="surface-3d flex flex-wrap gap-3 rounded-2xl p-6">
          {BRANDS.map((b) => (
            <div
              key={b.slug}
              className="rounded-xl border border-border bg-surface-0/50 px-4 py-2 text-center transition-colors hover:border-primary/40"
            >
              <TechText className="block text-sm font-bold text-foreground">
                {b.displayName}
              </TechText>
              <span className="text-[10px] text-muted-foreground">{b.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="۱۲. کارت محصول (pure + ProductGrid)"
        subtitle="کارت pure فقط props می‌گیرد؛ ProductGrid وضعیت store را تزریق می‌کند"
      >
        <ProductGrid
          products={sampleProducts}
          columns={4}
          isLoading={isLoading}
          skeletonCount={4}
        />
      </Section>

      <Section
        title="۱۲ب. کارت pure بدون store"
        subtitle="نمایش inCompare/inWishlist کنترل‌شده از props — مناسب Storybook"
      >
        {sampleProducts[0] && (
          <div className="grid max-w-xs grid-cols-1 gap-6">
            <ProductCard
              product={sampleProducts[0]}
              inCompare
              inWishlist
              onAddToCart={() => undefined}
              onCompare={() => undefined}
              onWishlist={() => undefined}
            />
          </div>
        )}
      </Section>

      <Section title="۱۳. حالت بارگذاری" subtitle="اسکلتون هم‌ابعاد کارت">
        <ProductGrid products={[]} columns={4} isLoading skeletonCount={4} />
      </Section>

      <Section title="۱۴. جدول مشخصات فنی" subtitle="گروه‌بندی خودکار + جهت‌دهی صحیح مقادیر فنی">
        <div className="surface-3d rounded-2xl p-6">
          {sampleProducts[0] ? (
            <SpecTable specs={sampleProducts[0].specs} />
          ) : (
            <p className="text-sm text-muted-foreground">در حال بارگذاری…</p>
          )}
        </div>
      </Section>

      <Section title="۱۵. مسیر راهنما و حالت خالی">
        <div className="space-y-6">
          <div className="surface-3d rounded-2xl p-6">
            <Breadcrumb
              items={[
                { label: 'خانه', href: '/' },
                { label: 'پرینتر', href: '/products?category=printer' },
                { label: 'کانن i-SENSYS LBP-2900' },
              ]}
            />
          </div>
          <div className="surface-3d rounded-2xl">
            <EmptyState
              icon={PackageSearch}
              title="محصولی یافت نشد"
              description="با این فیلترها نتیجه‌ای پیدا نکردیم. می‌توانید بازهٔ قیمت یا برند را تغییر دهید."
              action={<Button variant="outline">حذف همهٔ فیلترها</Button>}
            />
          </div>
        </div>
      </Section>
    </div>
  )
}
