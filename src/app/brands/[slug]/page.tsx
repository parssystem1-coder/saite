import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BrandProducts } from '@/components/brands/brand-products'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { TechText } from '@/components/ui/tech-text'
import { getProducts } from '@/lib/api'
import { BRANDS } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { buildBreadcrumbLd } from '@/lib/seo/breadcrumb-ld'
import { JsonLd } from '@/components/seo/json-ld'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const brand = BRANDS.find((b) => b.slug === slug)
  if (!brand) return { title: 'برند یافت نشد' }

  return {
    title: `محصولات ${brand.displayName}`,
    description: `خرید پرینتر، اسکنر، کپی و مواد مصرفی ${brand.displayName} (${brand.name}) با ضمانت اصالت.`,
    alternates: { canonical: `/brands/${brand.slug}` },
  }
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params
  const brand = BRANDS.find((b) => b.slug === slug)
  if (!brand) notFound()

  const all = await getProducts({ brand: brand.slug })
  const breadcrumbLd = buildBreadcrumbLd([
    { name: 'خانه', path: '/' },
    { name: 'برندها', path: '/brands' },
    { name: brand.displayName, path: `/brands/${brand.slug}` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <PageShell
        width="full"
        crumbs={[
          { label: 'خانه', href: '/' },
          { label: 'برندها', href: '/brands' },
          { label: brand.displayName },
        ]}
        header={
          <header className="mb-10">
            {/*
              عنوان لاتین است و باید dir="ltr" بماند، اما همچنان باید
              تنها <h1> صفحه باشد. پیش از این PageShell یک <h1> خالی
              رندر می‌کرد و این عنوان فقط یک span بود.
            */}
            <h1 className="text-3xl font-black text-primary md:text-4xl">
              <TechText>{brand.displayName}</TechText>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {brand.name} — {formatNumber(all.length)} کالا در کاتالوگ
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/products?brand=${brand.slug}`}>فیلتر در فروشگاه</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">مشاورهٔ خرید این برند</Link>
              </Button>
            </div>
          </header>
        }
      >
        <BrandProducts products={all} />
      </PageShell>
    </>
  )
}
