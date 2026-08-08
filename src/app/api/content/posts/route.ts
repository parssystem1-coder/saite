import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const isPublished = searchParams.has('published') ? searchParams.get('published') === 'true' : undefined
  const tag = searchParams.get('tag') || undefined
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 20

  const result = await contentService.listPosts({ isPublished, tag, page, limit })
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const post = await contentService.createPost(body)
  return NextResponse.json(post, { status: 201 })
}
