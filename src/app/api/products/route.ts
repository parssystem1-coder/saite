import { NextRequest, NextResponse } from 'next/server'
import { productsService } from '@/server/modules/products/service'
import { handleServiceError, parsePagination, checkMutationRateLimit } from '@/server/shared/http-utils'
import { requirePermission } from '@/lib/auth/server/require-role'
import type { ProductListQuery } from '@/lib/api-types'
import {
  productListFilterSchema,
  productCreateSchema,
  parseWithSchema,
  parseJsonBody,
} from '@/server/shared/validation'

// برای پشتیبانی featured/bestSeller (سازگار با src/lib/api.ts) بدون شکستن contract
interface FeaturedListQuery extends ProductListQuery {
  isFeatured?: boolean
  isBestSeller?: boolean
}

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
      const query: FeaturedListQuery = {
        category: undefined,
        perPage: Math.min(perPage, 20),
        page: 1,
      }
      // isFeatured/isBestSeller را به‌صورت dynamic به query اضافه می‌کنیم تا contract نشکند
      if (featured) query.isFeatured = true
      if (bestSeller) query.isBestSeller = true

      const result = await productsService.getList(query)
      return NextResponse.json(result.items)
    }

    const { page, perPage } = parsePagination(searchParams)
    // فیلترها با Zod اعتبارسنجی می‌شوند؛ صفحه‌بندی جدا parse شد تا رفتار موجود حفظ شود
    const filters = parseWithSchema(productListFilterSchema, Object.fromEntries(searchParams))

    const query: ProductListQuery = {
      q: filters.q,
      category:
        filters.category && filters.category !== 'all'
          ? (filters.category as ProductListQuery['category'])
          : undefined,
      subCategory: filters.subCategory,
      brand: filters.brand,
      technology: filters.technology,
      usage: filters.usage,
      color: filters.color,
      inStock: filters.inStock,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
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
    const rateLimitResponse = checkMutationRateLimit(req, 'product-create', 20, 60_000)
    if (rateLimitResponse) return rateLimitResponse

    const guard = await requirePermission('catalog:write')
    if (!guard.ok) return guard.response

    const body = parseWithSchema(productCreateSchema, await parseJsonBody(req))
    const product = await productsService.create(body, guard.admin.id)
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
