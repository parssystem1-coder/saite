'use client'

import { useMemo, useState } from 'react'
import type { ProductDraft, ProductFaq } from '../product-editor.types'
import { EditorSection, editorSurfaceClass } from '../components/EditorSection'
import { EditorToggle } from '../components/EditorToggle'
import {
  SEO_FIELD_LABELS,
  SEO_SUGGESTION_KEYS,
  type ProductSeoSuggestion,
  type SeoSuggestionKey,
} from '@/lib/seo/product-seo-suggestion'

type GenerateResponse = {
  suggestion?: ProductSeoSuggestion
  promptVersion?: string
  error?: string
}

function formatCurrent(key: SeoSuggestionKey, draft: ProductDraft, faqs: ProductFaq[]): string {
  switch (key) {
    case 'seoTitle':
      return draft.seoTitle.trim() || '—'
    case 'seoDescription':
      return draft.seoDescription.trim() || '—'
    case 'focusKeyword':
      return draft.focusKeyword.trim() || '—'
    case 'canonicalUrl':
      return draft.canonicalUrl.trim() || '—'
    case 'faqs':
      return faqs
        .filter((faq) => faq.question.trim() && faq.answer.trim())
        .map((faq) => `${faq.question}\n${faq.answer}`)
        .join('\n\n') || '—'
  }
}

function formatSuggested(key: SeoSuggestionKey, suggestion: ProductSeoSuggestion): string {
  switch (key) {
    case 'seoTitle':
      return suggestion.seoTitle ?? '—'
    case 'seoDescription':
      return suggestion.seoDescription ?? '—'
    case 'focusKeyword':
      return suggestion.focusKeyword ?? '—'
    case 'canonicalUrl':
      return suggestion.canonicalUrl ?? '—'
    case 'faqs':
      return (
        suggestion.faqs
          ?.map((faq) => `${faq.question}\n${faq.answer}`)
          .join('\n\n') ?? '—'
      )
  }
}

export function SeoAiPanel({
  draft,
  set,
  faqs,
  onFaqsChange,
}: {
  draft: ProductDraft
  set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void
  faqs: ProductFaq[]
  onFaqsChange: (faqs: ProductFaq[]) => void
}) {
  const [emptyOnly, setEmptyOnly] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<ProductSeoSuggestion | null>(null)
  const [promptVersion, setPromptVersion] = useState<string | null>(null)
  const [applied, setApplied] = useState<Partial<Record<SeoSuggestionKey, boolean>>>({})

  const rows = useMemo(() => {
    if (!suggestion) return []
    return SEO_SUGGESTION_KEYS.filter((key) => {
      if (key === 'faqs') return suggestion.faqs !== undefined
      return suggestion[key] !== undefined
    })
  }, [suggestion])

  const applyField = (key: SeoSuggestionKey) => {
    if (!suggestion) return
    if (key === 'seoTitle' && suggestion.seoTitle !== undefined) set('seoTitle', suggestion.seoTitle)
    if (key === 'seoDescription' && suggestion.seoDescription !== undefined) {
      set('seoDescription', suggestion.seoDescription)
    }
    if (key === 'focusKeyword' && suggestion.focusKeyword !== undefined) {
      set('focusKeyword', suggestion.focusKeyword)
    }
    if (key === 'canonicalUrl' && suggestion.canonicalUrl !== undefined) {
      set('canonicalUrl', suggestion.canonicalUrl)
    }
    if (key === 'faqs' && suggestion.faqs) {
      onFaqsChange(
        suggestion.faqs.map((faq, index) => ({
          id: `ai-faq-${index}-${faq.question.slice(0, 12)}`,
          question: faq.question,
          answer: faq.answer,
          visible: true,
          inSchema: true,
        }))
      )
    }
    setApplied((current) => ({ ...current, [key]: true }))
  }

  const rejectField = (key: SeoSuggestionKey) => {
    setSuggestion((current) => {
      if (!current) return current
      const next = { ...current }
      if (key === 'faqs') delete next.faqs
      else delete next[key]
      return next
    })
  }

  const generate = async () => {
    setLoading(true)
    setError(null)
    setSuggestion(null)
    setApplied({})
    try {
      const response = await fetch('/api/admin/products/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emptyOnly,
          draft: {
            name: draft.name,
            nameEn: draft.nameEn,
            slug: draft.slug,
            brand: draft.brand,
            series: draft.series,
            model: draft.model,
            category: draft.category,
            focusKeyword: draft.focusKeyword,
            seoTitle: draft.seoTitle,
            seoDescription: draft.seoDescription,
            canonicalUrl: draft.canonicalUrl,
            shortDescription: draft.shortDescription,
            longDescription: draft.longDescription,
          },
          faqs: faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
        }),
      })
      const data = (await response.json()) as GenerateResponse
      if (!response.ok) {
        setError(data.error ?? 'تولید سئو ناموفق بود.')
        return
      }
      if (!data.suggestion) {
        setError('پاسخ سرور خالی بود.')
        return
      }
      setSuggestion(data.suggestion)
      setPromptVersion(data.promptVersion ?? null)
    } catch {
      setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <EditorSection
        title="دستیار سئو (AI)"
        hint="خروجی فقط پیش‌نمایش است — تا تأیید شما چیزی ذخیره نمی‌شود"
      >
        <div className={`${editorSurfaceClass} grid gap-4 p-4`}>
          <p className="text-xs leading-6 text-[hsl(var(--muted-foreground))]">
            هوش مصنوعی عنوان، متا، کلمهٔ کلیدی و پرسش‌های متداول را پیشنهاد می‌دهد. هر فیلد را جدا
            اعمال یا رد کنید. امتیاز سئو در ستون کناری همان لحظه به‌روز می‌شود.
          </p>
          <EditorToggle
            checked={emptyOnly}
            onChange={setEmptyOnly}
            label="فقط فیلدهای خالی"
            hint="اگر روشن باشد فیلدهای پرشده بازنویسی نمی‌شوند"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void generate()}
              disabled={loading}
              className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-60"
            >
              {loading ? 'در حال تولید…' : 'تولید خودکار'}
            </button>
            {promptVersion ? (
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">نسخهٔ پرامپت: {promptVersion}</span>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="rounded-md border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] p-3 text-xs text-[hsl(var(--destructive))]">
              {error}
            </p>
          ) : null}
        </div>
      </EditorSection>

      {suggestion && rows.length > 0 ? (
        <EditorSection title="پیش‌نمایش تفاوت" hint="اعمال یا رد فیلد‌به‌فیلد">
          <div className="grid gap-3">
            {rows.map((key) => {
              const done = Boolean(applied[key])
              return (
                <article key={key} className={`${editorSurfaceClass} p-4`}>
                  <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">{SEO_FIELD_LABELS[key]}</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={done}
                        onClick={() => applyField(key)}
                        className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-[11px] font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-50"
                      >
                        {done ? 'اعمال شد' : 'اعمال'}
                      </button>
                      <button
                        type="button"
                        disabled={done}
                        onClick={() => rejectField(key)}
                        className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-[11px] disabled:opacity-50"
                      >
                        رد
                      </button>
                    </div>
                  </header>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[11px] text-[hsl(var(--muted-foreground))]">فعلی</p>
                      <pre className="whitespace-pre-wrap break-words rounded-md bg-[hsl(var(--surface-0))] p-3 text-xs leading-6">
                        {formatCurrent(key, draft, faqs)}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] text-[hsl(var(--muted-foreground))]">پیشنهادی</p>
                      <pre className="whitespace-pre-wrap break-words rounded-md bg-[hsl(var(--surface-0))] p-3 text-xs leading-6">
                        {formatSuggested(key, suggestion)}
                      </pre>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </EditorSection>
      ) : null}
    </>
  )
}
