/**
 * قراردادهای دامنهٔ محتوا — مقاله، دسته مقاله، صفحهٔ سفارشی.
 */

export type ContentStatus = 'draft' | 'published' | 'archived'

export interface ArticleCategory {
  id: string
  name: string
  slug: string
  description?: string
  order: number
  articleCount: number
  createdAt: string
}

export interface ArticleSummary {
  id: string
  title: string
  slug: string
  categoryId?: string
  categoryName?: string
  excerpt: string
  status: ContentStatus
  authorName: string
  readingMinutes: number
  publishedAt?: string
  updatedAt: string
}

export interface CustomPage {
  id: string
  title: string
  slug: string
  excerpt?: string
  status: ContentStatus
  showInFooter: boolean
  showInHeader: boolean
  updatedAt: string
  createdAt: string
}
