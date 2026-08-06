'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import type { SortOption } from '@/lib/constants'
import type { ProductFilters } from '@/lib/product-filters'
import type { CategorySlug } from '@/types/product'

/**
 * فیلترها را از URL می‌خواند و در URL می‌نویسد.
 *
 * چرا URL منبع حقیقت است و نه useState؟
 *  - لینک /products?category=printer از هر جای سایت کار می‌کند
 *  - کاربر می‌تواند نتیجهٔ فیلترشده را کپی و ارسال کند
 *  - دکمهٔ Back مرورگر درست عمل می‌کند
 *  - موتور جستجو صفحات دسته‌بندی را ایندکس می‌کند
 *
 * در فاز ۱ فیلترها در useState بودند، بنابراین تمام لینک‌های
 * «?category=…» عملاً نادیده گرفته می‌شدند. این هوک آن نقص را رفع می‌کند.
 */
export function useProductFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = React.useMemo<ProductFilters>(() => {
    const num = (key: string) => {
      const raw = searchParams.get(key)
      if (!raw) return undefined
      const parsed = Number(raw)
      return Number.isFinite(parsed) ? parsed : undefined
    }

    return {
      q: searchParams.get('q') ?? undefined,
      category: (searchParams.get('category') as CategorySlug | null) ?? 'all',
      subCategory: searchParams.get('subCategory') ?? 'all',
      brand: searchParams.get('brand') ?? 'all',
      technology: searchParams.get('technology') ?? 'all',
      usage: searchParams.get('usage') ?? 'all',
      color: searchParams.get('color') ?? 'all',
      inStock: searchParams.get('inStock') === '1',
      minPrice: num('minPrice'),
      maxPrice: num('maxPrice'),
      sort: (searchParams.get('sort') as SortOption | null) ?? 'newest',
    }
  }, [searchParams])

  const setParam = React.useCallback(
    (key: string, value: string | number | boolean | null) => {
      const params = new URLSearchParams(searchParams.toString())
      const isEmpty =
        value === null || value === '' || value === false || value === 'all' || value === 'newest'

      if (key === 'category') params.delete('subCategory')

      if (isEmpty) params.delete(key)
      else params.set(key, String(value === true ? 1 : value))

      params.delete('page') // هر تغییر فیلتر، به صفحهٔ اول برمی‌گردد
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  const resetFilters = React.useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [pathname, router])

  /** شمارهٔ صفحه هم در URL نگه داشته می‌شود تا اشتراک‌گذاری و Back کار کند */
  const page = React.useMemo(() => {
    const raw = Number(searchParams.get('page'))
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1
  }, [searchParams])

  const setPage = React.useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next <= 1) params.delete('page')
      else params.set('page', String(next))

      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      // برخلاف تغییر فیلتر، اینجا کاربر انتظار دارد به ابتدای فهرست برود
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [pathname, router, searchParams]
  )

  return { filters, setParam, resetFilters, page, setPage }
}
