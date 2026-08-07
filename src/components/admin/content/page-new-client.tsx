'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Save, CheckCircle2 } from 'lucide-react'
import { createMockContentAdapter, isValidSlug } from '@/lib/content/mock-adapter'
import type { CustomPage } from '@/types/content'

export default function PageNewClient() {
  const router = useRouter()
  const adapter = React.useMemo(() => createMockContentAdapter(), [])

  const [title, setTitle] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [excerpt, setExcerpt] = React.useState('')
  const [showInFooter, setShowInFooter] = React.useState(false)
  const [showInHeader, setShowInHeader] = React.useState(false)
  const [publishNow, setPublishNow] = React.useState(false)

  const [errors, setErrors] = React.useState<string[]>([])
  const [saved, setSaved] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (title.trim().length < 3) errs.push('عنوان حداقل ۳ حرف')
    if (!isValidSlug(slug.trim())) errs.push('slug نامعتبر (فقط انگلیسی، عدد، خط تیره)')
    if (adapter.listPages().some((p) => p.slug === slug.trim())) errs.push('این slug قبلاً استفاده شده')
    setErrors(errs)
    if (errs.length > 0) return

    const now = new Date().toISOString()
    const page: CustomPage = {
      id: `p-${Date.now()}`,
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || undefined,
      status: publishNow ? 'published' : 'draft',
      showInFooter,
      showInHeader,
      createdAt: now,
      updatedAt: now,
    }
    adapter.savePage(page)
    setSaved(true)
    setTimeout(() => router.push('/admin/pages'), 1200)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
          role="alert"
        >
          <ul className="list-disc pr-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {saved && (
        <div
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
          role="status"
        >
          <CheckCircle2 className="size-4" aria-hidden />
          صفحه ذخیره شد — انتقال به لیست…
        </div>
      )}

      <section className="surface-3d rounded-2xl p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">عنوان صفحه</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-muted-foreground">slug (URL انگلیسی)</span>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="مثال: about-us"
              className="w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-mono"
              required
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs text-muted-foreground">
            توضیح کوتاه (excerpt / SEO description)
          </span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm"
          />
        </label>
      </section>

      <section className="surface-3d rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-semibold">جای‌گیری در ناوبری</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={showInFooter}
              onChange={(e) => setShowInFooter(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="text-sm">نمایش در فوتر</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={showInHeader}
              onChange={(e) => setShowInHeader(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="text-sm">نمایش در هدر (نوار بالای سایت)</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="text-sm">همین حالا منتشر شود</span>
          </label>
        </div>
      </section>

      <div className="flex justify-start">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg"
        >
          <Save className="size-4" aria-hidden />
          ذخیرهٔ صفحه
        </button>
      </div>
    </form>
  )
}
