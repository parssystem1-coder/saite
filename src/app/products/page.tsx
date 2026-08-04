import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CatalogSkeleton } from '@/components/products/catalog-skeleton'
import { ProductsClient } from '@/components/products/products-client'
import { SectionHeader } from '@/components/ui/section-header'
import { firstParam, resolveCatalogHeading } from '@/lib/catalog-heading'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readHeadingParams(params: Record<string, string | string[] | undefined>) {
  return {
    category: firstParam(params.category),
    brand: firstParam(params.brand),
    q: firstParam(params.q),
  }
}

/**
 * متادیتای وابسته به فیلتر.
 * پیش از این هر ۶ آدرس `?category=` عنوان یکسان داشتند.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams
}): Promise<Metadata> {
  const params = readHeadingParams(await searchParams)
  const { title, description } = resolveCatalogHeading(params)

  return {
    title,
    description,
    // صفحات فیلترشده نباید با کاتالوگ اصلی رقابت کنند
    alternates: { canonical: '/products' },
    robots: params.q ? { index: false, follow: true } : undefined,
  }
}

/**
 * صفحهٔ کاتالوگ — Server Page + Client island.
 *
 * چرا عنوان اینجاست و نه داخل ProductsClient؟
 * چون کل کاتالوگ داخل مرز Suspense است، هر چیزی درون آن در HTML
 * اولیه دیده نمی‌شود. اندازه‌گیری خروجی بیلد نشان داد
 * `products.html` هیچ `<h1>` و هیچ لینک محصولی نداشت — فقط اسکلتون.
 * حالا عنوان و توضیح دسته در HTML سرور هستند و فقط گرید تعاملی
 * به کلاینت موکول می‌شود.
 */
export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = readHeadingParams(await searchParams)
  const { title, description } = resolveCatalogHeading(params)

  return (
    <div className="container mx-auto px-4 py-10">
      <SectionHeader as="h1" title={title} description={description} className="mb-8" />

      <Suspense fallback={<CatalogSkeleton />}>
        <ProductsClient />
      </Suspense>
    </div>
  )
}
