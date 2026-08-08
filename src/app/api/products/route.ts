import { NextRequest, NextResponse } from 'next/server'
import { productsService } from '@/server/modules/products/service'
import { handleServiceError } from './_utils'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const query = {
    q: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    subCategory: searchParams.get('subCategory') || undefined,
    brand: searchParams.get('brand') || undefined,
    technology: searchParams.get('technology') || undefined,
    usage: searchParams.get('usage') || undefined,
    color: searchParams.get('color') || undefined,
    inStock: searchParams.get('inStock') === 'true',
    minPrice: searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: searchParams.get('sort') || undefined,
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
    const body = await req.json()
    // TODO: requirePermission(req, 'catalog:write') در فاز بعد
    const product = await productsService.create(body, 'system')
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
