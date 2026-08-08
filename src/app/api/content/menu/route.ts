import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const location = searchParams.get('location') || 'header'
  const active = searchParams.has('active') ? searchParams.get('active') === 'true' : true

  const items = await contentService.listMenuItems({ location, active })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const item = await contentService.createMenuItem(body)
  return NextResponse.json(item, { status: 201 })
}
