import Link from 'next/link'
import { BRANDS } from '@/lib/constants'

/** نوار برندها — Server Component، بدون JS اضافه */
export function BrandStrip() {
  return (
    <section>
      <header className="mb-6 text-center">
        <h2 className="text-2xl font-black text-foreground md:text-3xl">برندهای موجود</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          نمایندگی و تأمین کالا از معتبرترین برندهای جهانی
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {BRANDS.map((b) => (
          <Link
            key={b.slug}
            href={`/products?brand=${b.slug}`}
            className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-1 px-3 py-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-depth-2"
          >
            <span
              dir="ltr"
              className="font-mono text-sm font-black text-muted-foreground transition-colors group-hover:text-primary"
            >
              {b.displayName}
            </span>
            <span className="mt-1 text-[11px] text-muted-foreground/70">{b.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
