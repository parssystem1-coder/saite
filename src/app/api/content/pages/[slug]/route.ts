import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await contentService.getPageBySlug(slug)
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  return NextResponse.json(page)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await contentService.getPageBySlug(slug)
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  const body = await req.json()
  const updated = await contentService.updatePage(page.id, body)
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await contentService.getPageBySlug(slug)
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  await contentService.deletePage(page.id)
  return NextResponse.json({ success: true })
}
