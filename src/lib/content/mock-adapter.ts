import type { ArticleCategory, ArticleSummary, CustomPage } from '@/types/content'

const KEYS = {
  categories: 'saite.content.article-categories',
  articles: 'saite.content.articles',
  pages: 'saite.content.pages',
} as const

function safeRead<T>(key: string, fallbackValue: T): T {
  if (typeof window === 'undefined') return fallbackValue
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallbackValue
    return (JSON.parse(raw) as T) ?? fallbackValue
  } catch {
    return fallbackValue
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch { /* full */ }
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

function categoriesFallback(): ArticleCategory[] {
  return [
    { id: 'c1', name: 'راهنمای خرید', slug: 'buying-guide', description: 'مقایسه و انتخاب دستگاه مناسب', order: 1, articleCount: 4, createdAt: daysAgo(120) },
    { id: 'c2', name: 'نگهداری و تعمیر', slug: 'maintenance', description: 'حل مشکلات رایج پرینتر و کپی', order: 2, articleCount: 6, createdAt: daysAgo(90) },
    { id: 'c3', name: 'اخبار محصولات', slug: 'product-news', description: 'معرفی مدل‌های جدید بازار', order: 3, articleCount: 3, createdAt: daysAgo(60) },
  ]
}

function articlesFallback(): ArticleSummary[] {
  return [
    { id: 'a1', title: 'راهنمای خرید پرینتر برای دفتر کوچک', slug: 'printer-buying-guide', categoryId: 'c1', categoryName: 'راهنمای خرید', excerpt: 'قبل از خرید پرینتر جدید، به این ۷ فاکتور دقت کنید…', status: 'published', authorName: 'کارشناس فروش', readingMinutes: 8, publishedAt: daysAgo(45), updatedAt: daysAgo(45) },
    { id: 'a2', title: 'چگونه تونر پرینتر لیزری را عوض کنیم؟', slug: 'how-to-replace-toner', categoryId: 'c2', categoryName: 'نگهداری و تعمیر', excerpt: 'قدم‌به‌قدم تعویض کارتریج تونر برای بیشتر مدل‌های HP و Canon…', status: 'published', authorName: 'کارشناس فنی', readingMinutes: 5, publishedAt: daysAgo(30), updatedAt: daysAgo(30) },
    { id: 'a3', title: 'نکات نگهداری از دستگاه کپی', slug: 'copier-maintenance-tips', categoryId: 'c2', categoryName: 'نگهداری و تعمیر', excerpt: '۱۰ نکتهٔ ساده برای افزایش عمر مفید دستگاه کپی…', status: 'published', authorName: 'کارشناس فنی', readingMinutes: 6, publishedAt: daysAgo(20), updatedAt: daysAgo(20) },
    { id: 'a4', title: 'بررسی HP LaserJet Pro M404dn', slug: 'hp-laserjet-m404dn-review', categoryId: 'c3', categoryName: 'اخبار محصولات', excerpt: 'یک هفته استفادهٔ عملی از این مدل جدید…', status: 'draft', authorName: 'کارشناس محتوا', readingMinutes: 10, updatedAt: daysAgo(2) },
  ]
}

function pagesFallback(): CustomPage[] {
  return [
    { id: 'p1', title: 'شرایط ضمانت', slug: 'warranty', excerpt: 'شرایط، محدودیت و مدت زمان ضمانت کالاها.', status: 'published', showInFooter: true, showInHeader: false, updatedAt: daysAgo(60), createdAt: daysAgo(60) },
    { id: 'p2', title: 'حریم خصوصی', slug: 'privacy', excerpt: 'نحوهٔ جمع‌آوری و استفاده از اطلاعات مشتریان.', status: 'published', showInFooter: true, showInHeader: false, updatedAt: daysAgo(90), createdAt: daysAgo(90) },
    { id: 'p3', title: 'قوانین و مقررات', slug: 'terms', excerpt: 'قوانین سایت و شرایط استفاده.', status: 'published', showInFooter: true, showInHeader: false, updatedAt: daysAgo(90), createdAt: daysAgo(90) },
    { id: 'p4', title: 'دربارهٔ ما', slug: 'about', excerpt: 'معرفی مجموعه و سابقهٔ فعالیت.', status: 'published', showInFooter: true, showInHeader: true, updatedAt: daysAgo(120), createdAt: daysAgo(180) },
  ]
}

export function createMockContentAdapter() {
  return {
    listCategories(): ArticleCategory[] {
      return safeRead<ArticleCategory[]>(KEYS.categories, categoriesFallback())
    },
    saveCategory(c: ArticleCategory): ArticleCategory[] {
      const all = this.listCategories()
      const idx = all.findIndex((x) => x.id === c.id)
      const next = idx >= 0 ? [...all.slice(0, idx), c, ...all.slice(idx + 1)] : [...all, c]
      safeWrite(KEYS.categories, next)
      return next
    },
    removeCategory(id: string): ArticleCategory[] {
      const next = this.listCategories().filter((c) => c.id !== id)
      safeWrite(KEYS.categories, next)
      return next
    },

    listArticles(): ArticleSummary[] {
      return safeRead<ArticleSummary[]>(KEYS.articles, articlesFallback())
    },
    saveArticle(a: ArticleSummary): ArticleSummary[] {
      const all = this.listArticles()
      const updated = { ...a, updatedAt: new Date().toISOString() }
      const idx = all.findIndex((x) => x.id === a.id)
      const next = idx >= 0 ? [...all.slice(0, idx), updated, ...all.slice(idx + 1)] : [...all, updated]
      safeWrite(KEYS.articles, next)
      return next
    },
    removeArticle(id: string): ArticleSummary[] {
      const next = this.listArticles().filter((a) => a.id !== id)
      safeWrite(KEYS.articles, next)
      return next
    },

    listPages(): CustomPage[] {
      return safeRead<CustomPage[]>(KEYS.pages, pagesFallback())
    },
    savePage(p: CustomPage): CustomPage[] {
      const all = this.listPages()
      const updated = { ...p, updatedAt: new Date().toISOString() }
      const idx = all.findIndex((x) => x.id === p.id)
      const next = idx >= 0 ? [...all.slice(0, idx), updated, ...all.slice(idx + 1)] : [...all, updated]
      safeWrite(KEYS.pages, next)
      return next
    },
    removePage(id: string): CustomPage[] {
      const next = this.listPages().filter((p) => p.id !== id)
      safeWrite(KEYS.pages, next)
      return next
    },
  }
}

export type ContentMockAdapter = ReturnType<typeof createMockContentAdapter>

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?$/

/**
 * اعتبارسنجی slug — تنها انگلیسی، عدد، خط تیره؛ نه پشت‌سرهم.
 * منبع واحد برای هر جای پروژه.
 */
export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && !slug.includes('--')
}
