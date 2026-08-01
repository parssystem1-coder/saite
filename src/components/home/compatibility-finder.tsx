'use client'

import { PackageSearch, Search, Sparkles } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PriceDisplay } from '@/components/ui/price-display'
import { StockBadge } from '@/components/ui/stock-badge'
import { TechText } from '@/components/ui/tech-text'
import { BRANDS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/product'

interface Props {
  /** مدل دستگاه‌هایی که برایشان مصرفی یا قطعه موجود است */
  devices: { brand: string; model: string }[]
  /** نگاشت مدل دستگاه به اقلام سازگار */
  compatibilityMap: Record<string, Product[]>
}

/**
 * ابزار «یافتن کارتریج و قطعهٔ سازگار».
 *
 * چرا این مهم‌ترین بخش صفحهٔ اصلی است؟
 * بخش عمدهٔ درآمد تکرارشوندهٔ این صنعت از تونر، کارتریج و درام می‌آید.
 * سؤال شمارهٔ یک مشتری این است: «من Canon 2900 دارم، چه تونری بخرم؟»
 * پاسخ دادن به این سؤال در سه کلیک، مزیت رقابتی اصلی فروشگاه است.
 *
 * به همین دلیل این ویجت بالاتر از فهرست محصولات قرار می‌گیرد.
 */
export function CompatibilityFinder({ devices, compatibilityMap }: Props) {
  const [brand, setBrand] = React.useState('')
  const [model, setModel] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [submitted, setSubmitted] = React.useState<string | null>(null)

  const brandsWithDevices = React.useMemo(() => {
    const slugs = new Set(devices.map((d) => d.brand))
    return BRANDS.filter((b) => slugs.has(b.slug))
  }, [devices])

  const modelsForBrand = React.useMemo(
    () => (brand ? devices.filter((d) => d.brand === brand).map((d) => d.model) : []),
    [brand, devices]
  )

  /** جستجوی متنی: نزدیک‌ترین مدل را از روی عبارت واردشده پیدا می‌کند */
  const resolveFromQuery = (raw: string): string | null => {
    const q = raw.trim().toLowerCase()
    if (!q) return null
    const models = devices.map((d) => d.model)
    return (
      models.find((m) => m.toLowerCase() === q) ??
      models.find((m) => m.toLowerCase().includes(q)) ??
      models.find((m) => q.includes(m.toLowerCase().replace(/[^a-z0-9]/g, ''))) ??
      null
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(model || resolveFromQuery(query))
  }

  const results = submitted ? (compatibilityMap[submitted] ?? []) : null

  return (
    <section className="scene-3d">
      <div className="surface-3d relative overflow-hidden rounded-3xl p-6 md:p-10">
        <div
          aria-hidden="true"
          className="absolute -top-32 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/20 blur-[110px]"
        />

        <div className="relative z-10">
          <header className="mb-7 text-center">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/12 px-3 py-1 text-[11px] font-bold text-primary">
              <Sparkles className="size-3.5" />
              پرکاربردترین ابزار فروشگاه
            </span>
            <h2 className="text-xl font-black text-balance text-foreground md:text-2xl">
              کارتریج و قطعهٔ سازگار با دستگاه خود را پیدا کنید
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              برند و مدل دستگاهتان را انتخاب کنید تا تمام مواد مصرفی و قطعات سازگار را ببینید.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1.5">
                <label htmlFor="cf-brand" className="text-[11px] font-bold text-muted-foreground">
                  برند دستگاه
                </label>
                <select
                  id="cf-brand"
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value)
                    setModel('')
                    setSubmitted(null)
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none focus-visible:border-primary/60"
                >
                  <option value="">انتخاب برند…</option>
                  {brandsWithDevices.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.displayName} — {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cf-model" className="text-[11px] font-bold text-muted-foreground">
                  مدل دستگاه
                </label>
                <select
                  id="cf-model"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value)
                    setSubmitted(null)
                  }}
                  disabled={!brand}
                  className="h-11 w-full rounded-xl border border-border bg-input px-3 text-sm shadow-[inset_0_2px_4px_hsl(0_0%_0%/0.35)] outline-none focus-visible:border-primary/60 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <option value="">{brand ? 'انتخاب مدل…' : 'ابتدا برند را انتخاب کنید'}</option>
                  {modelsForBrand.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <Button type="submit" size="lg" className="h-11 w-full md:w-auto">
                  <Search />
                  جستجو
                </Button>
              </div>
            </div>

            {/* مسیر جایگزین: تایپ مستقیم شمارهٔ مدل */}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
              <label
                htmlFor="cf-query"
                className="shrink-0 text-[11px] font-bold text-muted-foreground"
              >
                یا شمارهٔ مدل را وارد کنید:
              </label>
              <Input
                id="cf-query"
                dir="ltr"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSubmitted(null)
                }}
                placeholder="LBP-2900"
                className="h-10 flex-1 text-left font-mono"
              />
            </div>
          </form>

          {/* ── نتایج ─────────────────────────────────────── */}
          {results !== null && (
            <div className="mx-auto mt-8 max-w-3xl border-t border-border pt-6">
              {results.length > 0 ? (
                <>
                  <p className="mb-4 text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{results.length} قلم</span> سازگار
                    با <TechText className="font-bold text-primary">{submitted}</TechText> پیدا شد:
                  </p>
                  <ul className="space-y-2.5">
                    {results.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`/products/${item.slug}`}
                          className={cn(
                            'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border',
                            'bg-surface-0/50 p-3 transition-all',
                            'hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-depth-2'
                          )}
                        >
                          <div className="min-w-0">
                            <TechText className="block text-xs font-bold text-primary">
                              {item.model}
                            </TechText>
                            <p className="mt-0.5 line-clamp-1 text-sm text-foreground">
                              {item.name}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <StockBadge status={item.stockStatus} size="sm" />
                            <PriceDisplay
                              priceType={item.priceType}
                              price={item.price}
                              size="sm"
                            />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="flex flex-col items-center py-6 text-center">
                  <PackageSearch className="mb-3 size-9 text-muted-foreground" />
                  <p className="text-sm font-bold text-foreground">
                    برای این مدل موردی ثبت نشده است
                  </p>
                  <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    امکان تأمین سفارشی وجود دارد. با کارشناسان ما تماس بگیرید تا قطعهٔ مورد نیاز
                    شما را پیدا کنیم.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/contact">درخواست تأمین قطعه</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
