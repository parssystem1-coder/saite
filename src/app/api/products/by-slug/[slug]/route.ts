import { NextResponse } from 'next/server'
import { productsService } from '@/server/modules/products/service'
import { handleServiceError } from '../../_utils'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const product = await productsService.getBySlug(slug)
    return NextResponse.json(product)
  } catch (err) {
    return handleServiceError(err)
  }
}
