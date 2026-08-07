'use client'

import * as React from 'react'
import { FileText, Eye, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createMockContentAdapter } from '@/lib/content/mock-adapter'
import type { ContentStatus, CustomPage } from '@/types/content'
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

export default function PagesClient() {
  const adapter = React.useMemo(() => createMockContentAdapter(), [])
  const [pages, setPages] = React.useState<CustomPage[]>([])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPages(adapter.listPages())
  }, [adapter])

  const stats = {
    total: pages.length,
    published: pages.filter((p) => p.status === 'published').length,
    inFooter: pages.filter((p) => p.showInFooter).length,
    inHeader: pages.filter((p) => p.showInHeader).length,
  }

  const handleToggleFooter = (id: string) => {
    const target = pages.find((p) => p.id === id)
    if (!target) return
    setPages(adapter.savePage({ ...target, showInFooter: !target.showInFooter }))
  }
  const handleToggleHeader = (id: string) => {
    const target = pages.find((p) => p.id === id)
    if (!target) return
    setPages(adapter.savePage({ ...target, showInHeader: !target.showInHeader }))
  }
  const handleTogglePublish = (id: string) => {
    const target = pages.find((p) => p.id === id)
    if (!target) return
    setPages(
      adapter.savePage({
        ...target,
        status: target.status === 'published' ? 'draft' : 'published',
      })
    )
  }
  const handleRemove = (id: string) => {
    setPages(adapter.removePage(id))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={FileText} label="کل صفحات" value={stats.total.toLocaleString('fa-IR')} />
        <Stat icon={Eye} label="منتشر شده" value={stats.published.toLocaleString('fa-IR')} tone="success" />
        <Stat icon={FileText} label="در فوتر" value={stats.inFooter.toLocaleString('fa-IR')} />
        <Stat icon={FileText} label="در هدر" value={stats.inHeader.toLocaleString('fa-IR')} />
      </div>

      <div className="flex justify-end">
        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          <ArrowRight className="size-4" aria-hidden />
          افزودن صفحهٔ جدید
        </Link>
      </div>

      <section className="surface-3d overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="p-3">عنوان</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3">فوتر</th>
                <th className="p-3">هدر</th>
                <th className="p-3">به‌روز</th>
                <th className="p-3">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3">
                    <div>{p.title}</div>
                    <div className="font-mono text-xs text-muted-foreground">/{p.slug}</div>
                    {p.excerpt && (
                      <div className="mt-1 text-xs text-muted-foreground">{p.excerpt}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={p.showInFooter}
                      onChange={() => handleToggleFooter(p.id)}
                      className="size-4 accent-primary"
                      aria-label={`نمایش ${p.title} در فوتر`}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={p.showInHeader}
                      onChange={() => handleToggleHeader(p.id)}
                      className="size-4 accent-primary"
                      aria-label={`نمایش ${p.title} در هدر`}
                    />
                  </td>
                  <td className="p-3 text-xs">{formatJalaliDate(p.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTogglePublish(p.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs ${p.status === 'published' ? 'border border-border hover:bg-muted' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'}`}
                      >
                        {p.status === 'published' ? 'بازگردانی' : 'انتشار'}
                      </button>
                      <button
                        onClick={() => handleRemove(p.id)}
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
