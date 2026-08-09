import { NextRequest, NextResponse } from 'next/server'
import { productsService } from '@/server/modules/products/service'
import { handleServiceError } from '../_utils'
import { requirePermission } from '@/lib/auth/server/require-role'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await productsService.getById(id)
    return NextResponse.json(product)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePermission('catalog:write')
    if (!guard.ok) return guard.response

    const { id } = await params
    const body = await req.json()
    const product = await productsService.update(id, body, guard.admin.id)
    return NextResponse.json(product)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requirePermission('catalog:write')
    if (!guard.ok) return guard.response

    const { id } = await params
    await productsService.delete(id, guard.admin.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleServiceError(err)
  }
}
