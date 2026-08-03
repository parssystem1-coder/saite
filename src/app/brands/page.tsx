import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell } from '@/components/layout/page-shell'
import { TechText } from '@/components/ui/tech-text'
import { getProducts } from '@/lib/api'
import { BRANDS } from '@/lib/constants'
import { formatNumber } from '@/lib/format'

export const metadata: Metadata = {
  title: 'برندها',
  description:
    'برندهای تجهیزات اداری: Canon، HP، Epson، Ricoh، Konica Minolta، Brother و Panasonic.',
}

export default async function BrandsPage() {
  const products = await getProducts()
  const counts = Object.fromEntries(
    BRANDS.map((b) => [b.slug, products.filter((p) => p.brand === b.slug).length])
  ) as Record<string, number>

  return (
    <PageShell
      width="full"
      title="برندها"
      description="تأمین‌کنندهٔ رسمی و تخصصی برندهای معتبر ماشین‌های اداری."
      crumbs={[
        { label: 'خانه', href: '/' },
        { label: 'برندها' },
      ]}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BRANDS.map((b) => (
          <Link
            key={b.slug}
            href={`/brands/${b.slug}`}
            className="surface-3d flex flex-col rounded-2xl p-6 transition-transform hover:-translate-y-0.5"
          >
            <TechText className="text-xl font-black text-primary">{b.displayName}</TechText>
            <p className="mt-1 text-sm text-muted-foreground">{b.name}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              {formatNumber(counts[b.slug] ?? 0)} کالا در کاتالوگ
            </p>
            <span className="mt-3 text-xs font-bold text-primary">مشاهدهٔ محصولات ←</span>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
