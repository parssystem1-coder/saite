import 'server-only'
import { prisma } from '@/server/shared/db'
import { paginatedList } from '@/server/shared/repo-utils'

export const contentRepository = {
  async createPage(data: {
    slug: string
    title: string
    content: string
    metaTitle?: string
    metaDescription?: string
    isPublished?: boolean
    publishedAt?: Date | null
  }) {
    return prisma.page.create({
      data: {
        ...data,
        isPublished: data.isPublished ?? false,
      },
    })
  },

  async findPageBySlug(slug: string) {
    return prisma.page.findUnique({ where: { slug } })
  },

  async findPageById(id: string) {
    return prisma.page.findUnique({ where: { id } })
  },

  async listPages(opts: { isPublished?: boolean; page?: number; limit?: number }) {
    const where: Record<string, unknown> = {}
    if (opts.isPublished !== undefined) where.isPublished = opts.isPublished

    return paginatedList<Awaited<ReturnType<typeof prisma.page.findMany>>[number]>(
      prisma.page,
      { where, page: opts.page, limit: opts.limit }
    )
  },

  async updatePage(id: string, data: Partial<{
    slug: string; title: string; content: string; metaTitle: string; metaDescription: string; isPublished: boolean; publishedAt: Date | null
  }>) {
    return prisma.page.update({ where: { id }, data })
  },

  async deletePage(id: string) {
    return prisma.page.delete({ where: { id } })
  },

  async createPost(data: {
    slug: string
    title: string
    excerpt?: string
    content: string
    coverImage?: string
    tags?: string[]
    metaTitle?: string
    metaDescription?: string
    authorName?: string
    isPublished?: boolean
    publishedAt?: Date | null
  }) {
    return prisma.post.create({
      data: {
        ...data,
        tags: data.tags || [],
        isPublished: data.isPublished ?? false,
      },
    })
  },

  async findPostBySlug(slug: string) {
    return prisma.post.findUnique({ where: { slug } })
  },

  async findPostById(id: string) {
    return prisma.post.findUnique({ where: { id } })
  },

  async listPosts(opts: { isPublished?: boolean; tag?: string; page?: number; limit?: number }) {
    const where: Record<string, unknown> = {}
    if (opts.isPublished !== undefined) where.isPublished = opts.isPublished
    if (opts.tag) where.tags = { has: opts.tag }

    return paginatedList<Awaited<ReturnType<typeof prisma.post.findMany>>[number]>(
      prisma.post,
      { where, page: opts.page, limit: opts.limit }
    )
  },

  async updatePost(id: string, data: Partial<{
    slug: string; title: string; excerpt: string; content: string; coverImage: string; tags: string[]
    metaTitle: string; metaDescription: string; authorName: string; isPublished: boolean; publishedAt: Date | null
  }>) {
    return prisma.post.update({ where: { id }, data })
  },

  async deletePost(id: string) {
    return prisma.post.delete({ where: { id } })
  },

  async createMenuItem(data: {
    label: string
    url: string
    parentId?: string | null
    order?: number
    location?: string
    active?: boolean
  }) {
    return prisma.menuItem.create({
      data: {
        ...data,
        order: data.order || 0,
        location: data.location || 'header',
        active: data.active ?? true,
      },
    })
  },

  async findMenuItemById(id: string) {
    return prisma.menuItem.findUnique({
      where: { id },
      include: { children: true },
    })
  },

  async listMenuItems(opts: { location?: string; active?: boolean }) {
    const where: Record<string, unknown> = { parentId: null }
    if (opts.location) where.location = opts.location
    if (opts.active !== undefined) where.active = opts.active

    return prisma.menuItem.findMany({
      where,
      include: { children: { orderBy: { order: 'asc' } } },
      orderBy: { order: 'asc' },
    })
  },

  async updateMenuItem(id: string, data: Partial<{
    label: string; url: string; parentId: string | null; order: number; location: string; active: boolean
  }>) {
    return prisma.menuItem.update({ where: { id }, data })
  },

  async deleteMenuItem(id: string) {
    return prisma.menuItem.delete({ where: { id } })
  },
}
