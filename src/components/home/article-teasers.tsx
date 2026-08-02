import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/components/ui/section-header'
import { ARTICLES } from '@/lib/articles'
import { formatNumber } from '@/lib/format'

/** بخش مقالات صفحهٔ اصلی — Server Component */
export function ArticleTeasers() {
  return (
    <section>
      <SectionHeader
        title="مجلهٔ آموزشی"
        description="راهنمای خرید و نکات نگهداری تجهیزات اداری"
        action={
          <Button variant="link" asChild>
            <Link href="/blog">
              همهٔ مقالات
              <ArrowLeft />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
            <h3 className="text-base leading-snug font-bold text-balance text-foreground transition-colors group-hover:text-primary">
              {a.title}
            </h3>
            <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
              {a.excerpt}
            </p>
            <span className="mt-4 text-xs font-bold text-primary">ادامهٔ مطلب ←</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
