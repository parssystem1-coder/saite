import { ArrowLeft, Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Card3D } from '@/components/ui/card-3d'
import { getServiceBySlug, SERVICE_DETAILS } from '@/lib/services-data'
import { formatNumber } from '@/lib/format'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return SERVICE_DETAILS.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) return { title: 'خدمت یافت نشد' }

  return {
    title: service.title,
    description: service.description,
    alternates: { canonical: `/services/${service.slug}` },
  }
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params
  const service = getServiceBySlug(slug)
  if (!service) notFound()

  const Icon = service.icon

  return (
    <PageShell
      title={service.title}
      description={service.description}
      crumbs={[
        { label: 'خانه', href: '/' },
        { label: 'خدمات', href: '/services' },
        { label: service.title },
      ]}
    >
      <div className="flex items-start gap-4 not-prose">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12">
          <Icon className="size-6 text-primary" />
        </div>
        <p className="leading-loose text-muted-foreground">{service.intro}</p>
      </div>

      <section className="not-prose">
        <h2 className="mb-4 text-lg font-black text-foreground">آنچه ارائه می‌دهیم</h2>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {service.offerings.map((o) => (
            <li
              key={o}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-1 p-3.5 text-sm text-muted-foreground"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-stock-in" />
              {o}
            </li>
          ))}
        </ul>
      </section>

      <section className="not-prose">
        <h2 className="mb-4 text-lg font-black text-foreground">مراحل کار</h2>
        <ol className="grid gap-4 sm:grid-cols-2">
          {service.process.map((p, i) => (
            <li key={p.step}>
              <Card3D maxTilt={3}>
                <div className="p-5">
                  <span className="mb-2 inline-flex size-7 items-center justify-center rounded-lg bg-primary/15 text-xs font-black text-primary">
                    {formatNumber(i + 1)}
                  </span>
                  <p className="text-sm font-bold text-foreground">{p.step}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {p.detail}
                  </p>
                </div>
              </Card3D>
            </li>
          ))}
        </ol>
      </section>

      {service.note && (
        <p className="rounded-xl border border-primary/25 bg-primary/8 p-4 text-sm text-foreground not-prose">
          {service.note}
        </p>
      )}

      <div className="rounded-2xl border border-primary/25 bg-linear-to-l from-primary/15 to-surface-1 p-8 text-center not-prose">
        <h2 className="text-lg font-black text-foreground">درخواست خود را ثبت کنید</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          مدل دستگاه و شرح نیاز را بفرستید تا کارشناسان ما بررسی کنند.
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href={`/contact?subject=${service.slug === 'repair' ? 'repair' : 'quote'}`}>
            ثبت درخواست
            <ArrowLeft />
          </Link>
        </Button>
      </div>
    </PageShell>
  )
}
