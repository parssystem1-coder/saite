import { NextRequest, NextResponse } from 'next/server'
import { marketingService } from '@/server/modules/marketing/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError, parseLimit } from '@/server/shared/http-utils'
import { campaignCreateSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const active = searchParams.get('active')

    if (active === 'true') {
      const campaigns = await marketingService.getActiveCampaigns()
      return NextResponse.json(campaigns)
    }

    const guard = await requirePermission('marketing:read')
    if (!guard.ok) return guard.response

    const page = Number(searchParams.get('page')) || 1
    const limit = parseLimit(searchParams)
    const result = await marketingService.listCampaigns({ page, limit })
    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requirePermission('marketing:write')
    if (!guard.ok) return guard.response

    const body = parseWithSchema(campaignCreateSchema, await parseJsonBody(req))
    const campaign = await marketingService.createCampaign(body)
    return NextResponse.json(campaign, { status: 201 })
  } catch (err) {
    return handleServiceError(err)
  }
}
