import { absoluteUrl } from '@/lib/seo/site-url'

export type ArticleLdInput = {
  title: string
  description: string
  slug: string
  publishedAt: string
  author: string
}

/** Article schema.org */
export function buildArticleLd(article: ArticleLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: article.author },
    mainEntityOfPage: absoluteUrl(`/blog/${article.slug}`),
  }
}
