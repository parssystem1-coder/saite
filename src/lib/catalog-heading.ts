import { BRANDS, CATEGORIES } from '@/lib/constants'
import type { CategorySlug } from '@/types/product'

/**
 * عنوان و توضیح صفحهٔ کاتالوگ — منبع واحد برای `<h1>` و `<title>`.
 *
 * چرا جدا از کامپوننت؟
 * همین متن هم در Server Component (برای HTML اولیه و metadata) و هم
 * در sitemap استفاده می‌شود. اگر داخل UI بماند، عنوان صفحه و عنوان
 * متادیتا از هم جدا می‌افتند.
 *
 * نکتهٔ سئو: `/products?category=printer` تا پیش از این همان
 * `<title>` صفحهٔ اصلی کاتالوگ را داشت — یعنی ۶ آدرس در sitemap با
 * عنوان تکراری. این ماژول آن را رفع می‌کند.
 */

export interface CatalogHeading {
  title: string
  description: string
}

const DEFAULT_HEADING: CatalogHeading = {
  title: 'کاتالوگ محصولات',
  description:
    'پرینتر، اسکنر، دستگاه کپی، فکس، مواد مصرفی و قطعات یدکی با ضمانت اصالت کالا.',
}

/** تنها پارامترهایی که روی عنوان اثر دارند */
export interface CatalogHeadingParams {
  category?: string
  brand?: string
  q?: string
}

/** اولین مقدار را از پارامتر URL برمی‌دارد (Next می‌تواند آرایه بدهد) */
export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function resolveCatalogHeading(params: CatalogHeadingParams = {}): CatalogHeading {
  const category = CATEGORIES.find((c) => c.slug === (params.category as CategorySlug))
  const brand = BRANDS.find((b) => b.slug === params.brand)
  const q = params.q?.trim()

  if (q) {
    return {
      title: `جستجو: ${q}`,
      description: `نتایج جستجو برای «${q}» در کاتالوگ ماشین‌های اداری.`,
    }
  }

  if (category && brand) {
    return {
      title: `${category.name} ${brand.displayName}`,
      description: `${category.description} — فقط محصولات برند ${brand.displayName} (${brand.name}).`,
    }
  }

  if (category) {
    return { title: category.name, description: category.description }
  }

  if (brand) {
    return {
      title: `محصولات ${brand.displayName}`,
      description: `پرینتر، اسکنر، کپی و مواد مصرفی برند ${brand.displayName} (${brand.name}) با ضمانت اصالت کالا.`,
    }
  }

  return DEFAULT_HEADING
}
