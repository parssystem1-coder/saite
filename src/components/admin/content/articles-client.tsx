'use client'

import * as React from 'react'
import { FileText, Eye, PenLine, Trash2, Plus } from 'lucide-react'
import { createMockContentAdapter, isValidSlug } from '@/lib/content/mock-adapter'
import type { ArticleSummary, ContentStatus } from '@/types/content'
import { Badge, Stat, formatJalaliDate } from '@/components/admin/finance/finance-shared'

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشر شده',
  archived: 'بایگانی',
}
const STATUS_TONE: Record<ContentStatus, 'default' | 'success' | 'warn' | 'danger' | 'info'> = {
  draft: 'warn',
  published: 'success',
  archived: 'default',
}

export default function ArticlesClient() {
  const adapter = React.useMemo(() => createMockContentAdapter(), [])
  const [articles, setArticles] = React.useState<ArticleSummary[]>([])
  const [statusFilter, setStatusFilter] = React.useState<'all' | ContentStatus>('all')

  const [title, setTitle] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [excerpt, setExcerpt] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArticles(adapter.listArticles())
  }, [adapter])

  const filtered = statusFilter === 'all' ? articles : articles.filter((a) => a.status === statusFilter)
  const stats = {
    total: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    draft: articles.filter((a) => a.status === 'draft').length,
    archived: articles.filter((a) => a.status === 'archived').length,
  }

  const handleAdd = () => {
    if (title.trim().length < 5) {
      setError('عنوان حداقل ۵ حرف')
      return
    }
    if (!isValidSlug(slug.trim())) {
      setError('slug نامعتبر — فقط انگلیسی، عدد، خط تیره')
      return
    }
    if (articles.some((a) => a.slug === slug.trim())) {
      setError('این slug قبلاً استفاده شده')
      return
    }
    setError(null)
    const a: ArticleSummary = {
      id: `a-${Date.now()}`,
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      status: 'draft',
      authorName: 'کارشناس محتوا',
      readingMinutes: Math.max(1, Math.ceil(excerpt.trim().split(/\s+/).length / 200)),
      updatedAt: new Date().toISOString(),
    }
    setArticles(adapter.saveArticle(a))
    setTitle('')
    setSlug('')
    setExcerpt('')
  }

  const handlePublish = (id: string) => {
    const target = articles.find((a) => a.id === id)
    if (!target) return
    setArticles(
      adapter.saveArticle({
        ...target,
        status: target.status === 'published' ? 'draft' : 'published',
        publishedAt: target.status === 'published' ? undefined : new Date().toISOString(),
      })
    )
  }

  const handleRemove = (id: string) => {
    setArticles(adapter.removeArticle(id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={FileText} label="کل" value={stats.total.toLocaleString('fa-IR')} />
        <Stat icon={Eye} label="منتشر شده" value={stats.published.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={PenLine} label="پیش‌نویس" value={stats.draft.toLocaleString('fa-IR')} tone="warn" />
        <Stat icon={Trash2} label="بایگانی" value={stats.archived.toLocaleString('fa-IR')} />
      </div>

      <section className="surface-3d rounded-2xl p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Plus className="size-4" aria-hidden />
          مقالهٔ جدید
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان مقاله"
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug (مثال: how-to-scan)"
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-mono"
          />
        </div>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          placeholder="خلاصه (excerpt)"
          className="mt-3 w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAdd}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <Plus className="size-4" aria-hidden />
          افزودن پیش‌نویس
        </button>
        {error && (
          <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>
        )}
      </section>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          {(['all', 'published', 'draft', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            >
              {s === 'all' ? 'همه' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">عنوان</th>
                <th className="p-3">دسته</th>
                <th className="p-3">نویسنده</th>
                <th className="p-3">مدت مطالعه</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">به‌روز</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3">
                    <div>{a.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">/{a.slug}</div>
                  </td>
                  <td className="p-3 text-xs">{a.categoryName ?? '—'}</td>
                  <td className="p-3 text-xs">{a.authorName}</td>
                  <td className="p-3 text-xs">{a.readingMinutes.toLocaleString('fa-IR')} دقیقه</td>
                  <td className="p-3">
                    <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                  </td>
                  <td className="p-3 text-xs">{formatJalaliDate(a.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handlePublish(a.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs ${a.status === 'published' ? 'border border-border hover:bg-muted' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'}`}
                      >
                        {a.status === 'published' ? 'بازگردانی' : 'انتشار'}
                      </button>
                      <button
                        onClick={() => handleRemove(a.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        حذف
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
