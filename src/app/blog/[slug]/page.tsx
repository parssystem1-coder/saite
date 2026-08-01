import { Clock, User } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/layout/page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ARTICLES, getArticleBySlug } from '@/lib/articles'
import { formatNumber } from '@/lib/format'

type Props = { params: Promise<{ slug: string }> }

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** تولید مسیرهای استاتیک در زمان بیلد */
export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: 'مقاله یافت نشد' }

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      locale: 'fa_IR',
      publishedTime: article.publishedAt,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const others = ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 2)

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: article.author },
    mainEntityOfPage: `${BASE}/blog/${article.slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <PageShell
        title={article.title}
        crumbs={[
          { label: 'خانه', href: '/' },
          { label: 'مجله', href: '/blog' },
          { label: article.title },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3 not-prose">
          <Badge variant="secondary">{article.category}</Badge>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            {formatNumber(article.readMinutes)} دقیقه مطالعه
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="size-3.5" />
            {article.author}
          </span>
        </div>

        <p className="border-r-2 border-primary/50 pr-4 text-base leading-loose text-foreground">
          {article.intro}
        </p>

        {article.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {s.bullets && (
              <ul>
                {s.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="surface-3d rounded-2xl p-6 text-center not-prose">
          <p className="text-sm font-bold text-foreground">سوالی برایتان پیش آمد؟</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            کارشناسان ما رایگان مشاوره می‌دهند.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/contact">درخواست مشاوره</Link>
          </Button>
        </div>

        {others.length > 0 && (
          <section className="not-prose">
            <h2 className="mb-4 text-lg font-black text-foreground">مطالب دیگر</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {others.map((a) => (
                <Link
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="surface-3d rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
                >
                  <Badge variant="secondary" className="mb-2">
                    {a.category}
                  </Badge>
                  <p className="text-sm font-bold text-foreground">{a.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </PageShell>
    </>
  )
}
