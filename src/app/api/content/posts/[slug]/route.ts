import { NextRequest, NextResponse } from 'next/server'
import { contentService } from '@/server/modules/content/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { handleServiceError } from '@/server/shared/http-utils'
import { postUpdateSchema, parseWithSchema, parseJsonBody } from '@/server/shared/validation'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const post = await contentService.getPostBySlug(slug)
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (!post.isPublished) {
      const guard = await requirePermission('content:read')
      if (!guard.ok) return guard.response
    }
    return NextResponse.json(post)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const guard = await requirePermission('content:write')
    if (!guard.ok) return guard.response

    const { slug } = await params
    const post = await contentService.getPostBySlug(slug)
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    const body = parseWithSchema(postUpdateSchema, await parseJsonBody(req))
    const updated = await contentService.updatePost(post.id, body)
    return NextResponse.json(updated)
  } catch (err) {
    return handleServiceError(err)
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const guard = await requirePermission('content:write')
    if (!guard.ok) return guard.response

    const { slug } = await params
    const post = await contentService.getPostBySlug(slug)
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    await contentService.deletePost(post.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleServiceError(err)
  }
}
