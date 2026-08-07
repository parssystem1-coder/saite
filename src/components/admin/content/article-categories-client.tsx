'use client'

import * as React from 'react'
import { Folder, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { createMockContentAdapter, isValidSlug } from '@/lib/content/mock-adapter'
import type { ArticleCategory } from '@/types/content'
import { Stat } from '@/components/admin/finance/finance-shared'

export default function ArticleCategoriesClient() {
  const adapter = React.useMemo(() => createMockContentAdapter(), [])
  const [cats, setCats] = React.useState<ArticleCategory[]>([])

  const [name, setName] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCats(adapter.listCategories())
  }, [adapter])

  const sorted = [...cats].sort((a, b) => a.order - b.order)
  const totalArticles = cats.reduce((s, c) => s + c.articleCount, 0)

  const handleAdd = () => {
    if (name.trim().length < 2) {
      setError('نام حداقل ۲ حرف')
      return
    }
    if (!isValidSlug(slug.trim())) {
      setError('slug نامعتبر — فقط انگلیسی، عدد، خط تیره')
      return
    }
    if (cats.some((c) => c.slug === slug.trim())) {
      setError('این slug قبلاً استفاده شده')
      return
    }
    setError(null)
    const nextOrder = Math.max(0, ...cats.map((c) => c.order)) + 1
    const c: ArticleCategory = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      order: nextOrder,
      articleCount: 0,
      createdAt: new Date().toISOString(),
    }
    setCats(adapter.saveCategory(c))
    setName('')
    setSlug('')
    setDescription('')
  }

  const handleMove = (id: string, direction: -1 | 1) => {
    const idx = sorted.findIndex((c) => c.id === id)
    if (idx < 0) return
    const target = sorted[idx]
    const neighbor = sorted[idx + direction]
    if (!target || !neighbor) return
    const swapped = [
      adapter.saveCategory({ ...target, order: neighbor.order }),
    ]
    swapped.push(adapter.saveCategory({ ...neighbor, order: target.order }))
    setCats(swapped[swapped.length - 1] ?? [])
  }

  const handleRemove = (id: string) => {
    setCats(adapter.removeCategory(id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Folder} label="تعداد دسته" value={cats.length.toLocaleString('fa-IR')} />
        <Stat icon={Folder} label="کل مقالات" value={totalArticles.toLocaleString('fa-IR')} />
        <Stat
          icon={Folder}
          label="پرمقاله‌ترین"
          value={
            [...cats].sort((a, b) => b.articleCount - a.articleCount)[0]?.name ?? '—'
          }
        />
        <Stat icon={Folder} label="خالی از مقاله" value={cats.filter((c) => c.articleCount === 0).length.toLocaleString('fa-IR')} tone="warn" />
      </div>

      <section className="surface-3d rounded-2xl p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Plus className="size-4" aria-hidden />
          دستهٔ جدید
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام دسته"
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug"
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-mono"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیح کوتاه (اختیاری)"
            className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <Plus className="size-4" aria-hidden />
          افزودن دسته
        </button>
        {error && (
          <p className="mt-2 text-xs text-destructive" role="alert">{error}</p>
        )}
      </section>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="p-3">ترتیب</th>
              <th className="p-3">دسته</th>
              <th className="p-3">تعداد مقاله</th>
              <th className="p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{c.order.toLocaleString('fa-IR')}</td>
                <td className="p-3">
                  <div>{c.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">/{c.slug}</div>
                  {c.description && (
                    <div className="text-xs text-muted-foreground">{c.description}</div>
                  )}
                </td>
                <td className="p-3">{c.articleCount.toLocaleString('fa-IR')}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => handleMove(c.id, -1)}
                      disabled={i === 0}
                      className="rounded-lg border border-border p-1.5 disabled:opacity-40 hover:bg-muted"
                      aria-label="بالا"
                    >
                      <ArrowUp className="size-3.5" aria-hidden />
                    </button>
                    <button
                      onClick={() => handleMove(c.id, 1)}
                      disabled={i === sorted.length - 1}
                      className="rounded-lg border border-border p-1.5 disabled:opacity-40 hover:bg-muted"
                      aria-label="پایین"
                    >
                      <ArrowDown className="size-3.5" aria-hidden />
                    </button>
                    <button
                      onClick={() => handleRemove(c.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
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
      </section>
    </div>
  )
}
