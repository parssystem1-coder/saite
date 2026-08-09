import { NextRequest, NextResponse } from 'next/server'
import { productsService } from '@/server/modules/products/service'
import { handleServiceError, parseNumberParam, parsePagination } from './_utils'
import { requirePermission } from '@/lib/auth/server/require-role'
import type { ProductListQuery } from '@/lib/api-types'
import type { CategorySlug } from '@/types/product'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    // featured/bestSeller برای سازگاری با src/lib/api.ts — باید آرایه برگرداند نه صفحه‌بندی
    const featured = searchParams.get('featured') === '1' || searchParams.get('featured') === 'true'
    const bestSeller =
      searchParams.get('bestSeller') === '1' ||
      searchParams.get('bestSeller') === 'true' ||
      searchParams.get('best_seller') === '1'

    if (featured || bestSeller) {
      const { perPage } = parsePagination(searchParams, 20)
      const query: ProductListQuery = {
        category: undefined,
        perPage: Math.min(perPage, 20),
        page: 1,
      } as unknown as ProductListQuery
      // isFeatured/isBestSeller را به‌صورت dynamic به query اضافه می‌کنیم تا contract نشکند
      if (featured) (query as unknown as Record<string, unknown>).isFeatured = true
      if (bestSeller) (query as unknown as Record<string, unknown>).isBestSeller = true

      const result = await productsService.getList(query)
      return NextResponse.json(result.items)
    }

    const { page, perPage } = parsePagination(searchParams)

    const category = searchParams.get('category')
    const sort = searchParams.get('sort')

    const query: ProductListQuery = {
      q: searchParams.get('q') || undefined,
      category: (category && category !== 'all' ? category : undefined) as CategorySlug | undefined,
      subCategory: searchParams.get('subCategory') || undefined,
      brand: searchParams.get('brand') || undefined,
      technology: searchParams.get('technology') || undefined,
      usage: searchParams.get('usage') || undefined,
      color: searchParams.get('color') || undefined,
      inStock: searchParams.get('inStock') === 'true',
      minPrice: parseNumberParam(searchParams.get('minPrice'), 'minPrice'),
      maxPrice: parseNumberParam(searchParams.get('maxPrice'), 'maxPrice'),
      sort: (sort || undefined) as ProductListQuery['sort'],
      page,
      perPage,
    }

    const result = await productsService.getList(query)
    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requirePermission('catalog:write')
    if (!guard.ok) return guard.response

    const body = await req.json()
    const product = await productsService.create(body, guard.admin.id)
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
