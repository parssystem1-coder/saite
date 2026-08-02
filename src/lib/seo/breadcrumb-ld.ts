import { absoluteUrl } from '@/lib/seo/site-url'

export type BreadcrumbItem = {
  name: string
  /** مسیر نسبی یا URL کامل؛ آخرین آیتم می‌تواند بدون path باشد */
  path?: string
}

/** BreadcrumbList schema.org */
export function buildBreadcrumbLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  }
}
