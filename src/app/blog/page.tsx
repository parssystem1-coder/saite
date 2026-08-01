import { Clock } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell } from '@/components/layout/page-shell'
import { Badge } from '@/components/ui/badge'
import { ARTICLES } from '@/lib/articles'
import { formatNumber } from '@/lib/format'

export const metadata: Metadata = {
  title: 'مجلهٔ آموزشی',
  description:
    'راهنمای خرید تجهیزات اداری، نکات نگهداری پرینتر و دستگاه کپی، و آموزش‌های فنی کاربردی.',
}

export default function BlogPage() {
  return (
    <PageShell
      title="مجلهٔ آموزشی"
      description="راهنمای خرید و نکات نگهداری تجهیزات اداری، نوشتهٔ تیم فنی ما."
    >
      <div className="grid gap-6 not-prose md:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/blog/${a.slug}`}
            className="group surface-3d flex flex-col rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <Badge variant="secondary">{a.category}</Badge>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                {formatNumber(a.readMinutes)} دقیقه
              </span>
            </div>
            <h2 className="text-base leading-snug font-bold text-balance text-foreground transition-colors group-hover:text-primary">
              {a.title}
            </h2>
            <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
              {a.excerpt}
            </p>
            <span className="mt-4 text-xs font-bold text-primary">ادامهٔ مطلب ←</span>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
