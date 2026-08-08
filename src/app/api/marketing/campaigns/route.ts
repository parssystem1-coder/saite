import { NextRequest, NextResponse } from 'next/server'
import { marketingService } from '@/server/modules/marketing/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const active = searchParams.get('active')

  if (active === 'true') {
    const campaigns = await marketingService.getActiveCampaigns()
    return NextResponse.json(campaigns)
  }

  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20
  const result = await marketingService.listCampaigns({ page, limit })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const campaign = await marketingService.createCampaign(body)
  return NextResponse.json(campaign, { status: 201 })
}
