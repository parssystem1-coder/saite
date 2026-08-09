import { NextRequest, NextResponse } from 'next/server'
import { productsService } from '@/server/modules/products/service'
import { handleServiceError } from './_utils'
import { requirePermission } from '@/lib/auth/server/require-role'
import type { ProductListQuery } from '@/lib/api-types'
import type { CategorySlug } from '@/types/product'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

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
    minPrice: searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: (sort || undefined) as ProductListQuery['sort'],
    page: searchParams.has('page') ? Number(searchParams.get('page')) : undefined,
    perPage: searchParams.has('perPage') ? Number(searchParams.get('perPage')) : undefined,
  }

  try {
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
