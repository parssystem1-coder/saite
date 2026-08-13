'use client'

import { useMemo, useRef, useState } from 'react'
import type { Attribute, ProductDraft, ProductFaq, ProductImage } from '../product-editor.types'
import { EditorField, editorInputClass } from '../components/EditorField'
import { EditorSection, editorSurfaceClass } from '../components/EditorSection'
import { EditorToggle } from '../components/EditorToggle'
import {
  SEO_FIELD_LABELS,
  SEO_SUGGESTION_KEYS,
  hasProductSeoSeed,
  type ProductSeoSuggestion,
  type SeoSuggestionKey,
} from '@/lib/seo/product-seo-suggestion'
import {
  buildProductSeoPack,
  PRODUCT_SEO_IMPORT_MAX_CHARS,
  productSeoPackFilename,
} from '@/lib/seo/product-seo-pack'
import {
  DEFAULT_PRODUCT_SEO_PACK_ID,
  listProductSeoPromptPacks,
  type ProductSeoPromptPackId,
} from '@/lib/seo/product-seo-prompt-packs'
import type { KeywordInsight } from '@/lib/seo/seo-tool-contract'
import {
  applyImageAlts,
  applyProductSeoSuggestionToDraft,
  suggestionAttributesToEditor,
  suggestionFaqsToEditor,
} from '../apply-seo-suggestion'

type SuggestionSource = 'generate' | 'file'

type SeoActionResponse = {
  suggestion?: ProductSeoSuggestion
  promptVersion?: string
  error?: string
}

type KeywordResponse = {
  insight?: KeywordInsight
  error?: string
}

function formatCurrent(
  key: SeoSuggestionKey,
  draft: ProductDraft,
  faqs: ProductFaq[],
  attributes: Attribute[],
  images: ProductImage[]
): string {
  switch (key) {
    case 'name':
      return draft.name.trim() || '—'
    case 'nameEn':
      return draft.nameEn.trim() || '—'
    case 'slug':
      return draft.slug.trim() || '—'
    case 'sku':
      return draft.sku.trim() || '—'
    case 'series':
      return draft.series.trim() || '—'
    case 'model':
      return draft.model.trim() || '—'
    case 'category':
      return draft.category.trim() || '—'
    case 'subCategory':
      return draft.subCategory.trim() || '—'
    case 'brand':
      return draft.brand.trim() || '—'
    case 'shortDescription':
      return draft.shortDescription.trim() || '—'
    case 'longDescription':
      return draft.longDescription.trim() || '—'
    case 'seoTitle':
      return draft.seoTitle.trim() || '—'
    case 'seoDescription':
      return draft.seoDescription.trim() || '—'
    case 'focusKeyword':
      return draft.focusKeyword.trim() || '—'
    case 'canonicalUrl':
      return draft.canonicalUrl.trim() || '—'
    case 'faqs':
      return (
        faqs
          .filter((faq) => faq.question.trim() && faq.answer.trim())
          .map((faq) => `${faq.question}\n${faq.answer}`)
          .join('\n\n') || '—'
      )
    case 'attributes':
      return (
        attributes
          .filter((item) => item.name.trim() && item.value.trim())
          .map((item) => `${item.name}: ${item.value}${item.unit ? ` ${item.unit}` : ''}`)
          .join('\n') || '—'
      )
    case 'imageAlts':
      return images.map((image) => image.alt.trim() || '—').join('\n') || '—'
  }
}

function formatSuggested(key: SeoSuggestionKey, suggestion: ProductSeoSuggestion): string {
  switch (key) {
    case 'faqs':
      return suggestion.faqs?.map((faq) => `${faq.question}\n${faq.answer}`).join('\n\n') ?? '—'
    case 'attributes':
      return (
        suggestion.attributes
          ?.map((item) => `${item.name}: ${item.value}${item.unit ? ` ${item.unit}` : ''}`)
          .join('\n') ?? '—'
      )
    case 'imageAlts':
      return suggestion.imageAlts?.join('\n') ?? '—'
    default:
      return suggestion[key] ?? '—'
  }
}

function specsFromAttributes(attributes: Attribute[] | undefined): Record<string, string> {
  const specs: Record<string, string> = {}
  for (const attribute of (attributes ?? []).slice(0, 12)) {
    const name = attribute.name.trim()
    const value = attribute.value.trim()
    if (!name || !value) continue
    specs[name] = attribute.unit.trim() ? `${value} ${attribute.unit.trim()}` : value
  }
  return specs
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function SeoAiPanel({
  draft,
  set,
  faqs,
  onFaqsChange,
  attributes = [],
  onAttributesChange,
  images = [],
  onImagesChange,
}: {
  draft: ProductDraft
  set: <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => void
  faqs: ProductFaq[]
  onFaqsChange: (faqs: ProductFaq[]) => void
  attributes?: Attribute[]
  onAttributesChange?: (attributes: Attribute[]) => void
  images?: ProductImage[]
  onImagesChange?: (images: ProductImage[]) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [emptyOnly, setEmptyOnly] = useState(false)
  const [packId, setPackId] = useState<ProductSeoPromptPackId>(DEFAULT_PRODUCT_SEO_PACK_ID)
  const [busy, setBusy] = useState<'generate' | 'import' | 'keyword' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<ProductSeoSuggestion | null>(null)
  const [promptVersion, setPromptVersion] = useState<string | null>(null)
  const [source, setSource] = useState<SuggestionSource | null>(null)
  const [applied, setApplied] = useState<Partial<Record<SeoSuggestionKey, boolean>>>({})
  const [insight, setInsight] = useState<KeywordInsight | null>(null)

  const rows = useMemo(() => {
    if (!suggestion) return []
    return SEO_SUGGESTION_KEYS.filter((key) => {
      if (key === 'faqs') return suggestion.faqs !== undefined
      if (key === 'attributes') return suggestion.attributes !== undefined
      if (key === 'imageAlts') return suggestion.imageAlts !== undefined
      return suggestion[key] !== undefined
    })
  }, [suggestion])

  const currentSnapshot = () => ({
    name: draft.name,
    nameEn: draft.nameEn,
    slug: draft.slug,
    sku: draft.sku,
    series: draft.series,
    model: draft.model,
    category: draft.category,
    subCategory: draft.subCategory,
    brand: draft.brand,
    shortDescription: draft.shortDescription,
    longDescription: draft.longDescription,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    focusKeyword: draft.focusKeyword,
    canonicalUrl: draft.canonicalUrl,
    faqs: faqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
    attributes: attributes.map((item) => ({ name: item.name, value: item.value })),
    imageAlts: images.map((image) => image.alt),
  })

  const applyField = (key: SeoSuggestionKey) => {
    if (!suggestion) return
    if (key === 'faqs' && suggestion.faqs) {
      onFaqsChange(suggestionFaqsToEditor(suggestion.faqs))
    } else if (key === 'attributes' && suggestion.attributes && onAttributesChange) {
      onAttributesChange(suggestionAttributesToEditor(suggestion.attributes))
    } else if (key === 'imageAlts' && suggestion.imageAlts && onImagesChange) {
      onImagesChange(applyImageAlts(images, suggestion.imageAlts))
    } else {
      applyProductSeoSuggestionToDraft(
        { [key]: suggestion[key] } as ProductSeoSuggestion,
        set
      )
    }
    setApplied((current) => ({ ...current, [key]: true }))
  }

  const applyAllToDraft = (data: ProductSeoSuggestion) => {
    applyProductSeoSuggestionToDraft(data, set)
    if (data.faqs) onFaqsChange(suggestionFaqsToEditor(data.faqs))
    if (data.attributes && onAttributesChange) {
      onAttributesChange(suggestionAttributesToEditor(data.attributes))
    }
    if (data.imageAlts && onImagesChange) {
      onImagesChange(applyImageAlts(images, data.imageAlts))
    }
    const nextApplied: Partial<Record<SeoSuggestionKey, boolean>> = {}
    for (const key of SEO_SUGGESTION_KEYS) {
      if (key === 'faqs' && data.faqs) nextApplied.faqs = true
      else if (key === 'attributes' && data.attributes) nextApplied.attributes = true
      else if (key === 'imageAlts' && data.imageAlts) nextApplied.imageAlts = true
      else if (data[key] !== undefined) nextApplied[key] = true
    }
    setApplied(nextApplied)
  }

  const rejectField = (key: SeoSuggestionKey) => {
    setSuggestion((current) => {
      if (!current) return current
      const next = { ...current }
      if (key === 'faqs') delete next.faqs
      else if (key === 'attributes') delete next.attributes
      else if (key === 'imageAlts') delete next.imageAlts
      else delete next[key]
      return next
    })
  }

  const acceptSuggestion = (data: SeoActionResponse, nextSource: SuggestionSource) => {
    if (!data.suggestion) {
      setError('پاسخ سرور خالی بود.')
      return
    }
    setSuggestion(data.suggestion)
    setPromptVersion(data.promptVersion ?? null)
    setSource(nextSource)
    if (nextSource === 'generate') {
      applyAllToDraft(data.suggestion)
    }
  }

  const generate = async () => {
    if (
      !hasProductSeoSeed({
        name: draft.name,
        brand: draft.brand,
        model: draft.model,
        focusKeyword: draft.focusKeyword,
      })
    ) {
      setError('برای محصول جدید حداقل نام، یا برند و مدل را در تب پایه وارد کنید.')
      return
    }
    setBusy('generate')
    setError(null)
    setSuggestion(null)
    setApplied({})
    setSource(null)
    try {
      const response = await fetch('/api/admin/products/seo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emptyOnly,
          packId,
          keywordHints: insight?.related ?? [],
          imageCount: images.length,
          imageAlts: images.map((image) => image.alt),
          attributes: attributes.map((item) => ({ name: item.name, value: item.value })),
          draft: {
            name: draft.name,
            nameEn: draft.nameEn,
            slug: draft.slug,
            sku: draft.sku,
            brand: draft.brand,
            series: draft.series,
            model: draft.model,
            category: draft.category,
            subCategory: draft.subCategory,
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
      const data = (await response.json()) as SeoActionResponse
      if (!response.ok) {
        setError(data.error ?? 'تولید سئو ناموفق بود.')
        return
      }
      acceptSuggestion(data, 'generate')
    } catch {
      setError('ارتباط با سرور برقرار نشد. دوباره تلاش کنید.')
    } finally {
      setBusy(null)
    }
  }

  const exportPack = () => {
    const pack = buildProductSeoPack({
      name: draft.name,
      nameEn: draft.nameEn,
      slug: draft.slug,
      brand: draft.brand,
      series: draft.series,
      model: draft.model,
      category: draft.category,
      shortDescription: draft.shortDescription,
      longDescription: draft.longDescription,
      specs: specsFromAttributes(attributes),
      current: currentSnapshot(),
      emptyOnly,
      promptPackId: packId,
      keywordHints: insight?.related ?? [],
    })
    downloadJson(productSeoPackFilename(draft.slug), pack)
  }

  const lookupKeyword = async () => {
    const keyword = draft.focusKeyword.trim() || draft.name.trim() || `${draft.brand} ${draft.model}`.trim()
    if (!keyword) {
      setError('برای بررسی، نام محصول یا برند و مدل را وارد کنید.')
      return
    }
    setBusy('keyword')
    setError(null)
    try {
      const response = await fetch('/api/admin/products/seo/keyword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.slice(0, 80) }),
      })
      const data = (await response.json()) as KeywordResponse
      if (!response.ok || !data.insight) {
        setError(data.error ?? 'بررسی کلمهٔ کلیدی ناموفق بود.')
        return
      }
      setInsight(data.insight)
    } catch {
      setError('ارتباط با سرور برای بررسی کلمهٔ کلیدی برقرار نشد.')
    } finally {
      setBusy(null)
    }
  }

  const importFile = async (file: File) => {
    setError(null)
    if (file.size > PRODUCT_SEO_IMPORT_MAX_CHARS) {
      setError('حجم فایل بیش از ۶۴ کیلوبایت است.')
      return
    }
    setBusy('import')
    setSuggestion(null)
    setApplied({})
    setSource(null)
    try {
      const rawText = await file.text()
      if (rawText.length > PRODUCT_SEO_IMPORT_MAX_CHARS) {
        setError('حجم فایل بیش از ۶۴ کیلوبایت است.')
        return
      }
      const snapshot = currentSnapshot()
      const response = await fetch('/api/admin/products/seo/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText,
          emptyOnly,
          current: snapshot,
          faqs: snapshot.faqs,
        }),
      })
      const data = (await response.json()) as SeoActionResponse
      if (!response.ok) {
        setError(data.error ?? 'ایمپورت فایل ناموفق بود.')
        return
      }
      acceptSuggestion(data, 'file')
    } catch {
      setError('خواندن یا ارسال فایل ناموفق بود. دوباره تلاش کنید.')
    } finally {
      setBusy(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <EditorSection
        title="دستیار سئو (AI)"
        hint="محصول جدید را کامل می‌کند — قیمت و خدمات دست نمی‌خورد؛ انتشار با شماست"
      >
        <div className={`${editorSurfaceClass} grid gap-4 p-4`}>
          <p className="text-xs leading-6 text-[hsl(var(--muted-foreground))]">
            برای محصول جدید، حداقل نام یا برند و مدل را در تب پایه بگذارید و «تکمیل حرفه‌ای محصول» را
            بزنید. پیش‌نویس تب‌های پایه، مشخصات، محتوا و سئو پر می‌شود تا خودتان بازبینی و ویرایش
            کنید. تب قیمت و موجودی و تب خدمات و ارتباطات عمداً خالی می‌مانند. عکس را خودتان بارگذاری
            کنید؛ اگر عکس باشد فقط متن جایگزین نوشته می‌شود. انتشار فقط با دکمهٔ پایین صفحه است.
          </p>
          <EditorToggle
            checked={emptyOnly}
            onChange={setEmptyOnly}
            label="فقط فیلدهای خالی"
            hint="برای محصول جدید خاموش بماند تا همهٔ بخش‌های مجاز پر شوند"
          />
          <EditorField label="بستهٔ پرامپت" hint="لحن و تمرکز تولید را عوض می‌کند؛ قرارداد JSON ثابت می‌ماند">
            <select
              className={editorInputClass}
              value={packId}
              aria-label="بستهٔ پرامپت"
              onChange={(event) => setPackId(event.target.value as ProductSeoPromptPackId)}
            >
              {listProductSeoPromptPacks().map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.title}
                </option>
              ))}
            </select>
          </EditorField>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void generate()}
              disabled={busy !== null}
              className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))] disabled:opacity-60"
            >
              {busy === 'generate' ? 'در حال تولید…' : 'تکمیل حرفه‌ای محصول'}
            </button>
            <button
              type="button"
              onClick={exportPack}
              disabled={busy !== null}
              className="rounded-md border border-[hsl(var(--border))] px-4 py-2 text-xs font-bold disabled:opacity-60"
            >
              دانلود فایل سئو
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy !== null}
              className="rounded-md border border-[hsl(var(--border))] px-4 py-2 text-xs font-bold disabled:opacity-60"
            >
              {busy === 'import' ? 'در حال ایمپورت…' : 'ایمپورت فایل'}
            </button>
            <button
              type="button"
              onClick={() => void lookupKeyword()}
              disabled={busy !== null}
              className="rounded-md border border-[hsl(var(--border))] px-4 py-2 text-xs font-bold disabled:opacity-60"
            >
              {busy === 'keyword' ? 'در حال بررسی…' : 'بررسی کلمهٔ کلیدی'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="ایمپورت فایل سئو"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void importFile(file)
              }}
            />
            {promptVersion ? (
              <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                {source === 'file' ? 'منبع: فایل ایمپورت‌شده' : 'منبع: دستیار داخلی'} — نسخه:{' '}
                {promptVersion}
              </span>
            ) : null}
          </div>
          {insight ? (
            <pre className="whitespace-pre-wrap break-words rounded-md bg-[hsl(var(--surface-0))] p-3 text-xs leading-6">
              {[
                `منبع: ${insight.mode === 'live' ? insight.source : 'نمونهٔ آزمایشی (stub)'}`,
                `کلمه: ${insight.keyword}`,
                `حجم تقریبی: ${insight.searchVolume ?? '—'}`,
                `سختی: ${insight.difficulty ?? '—'}`,
                `مرتبط: ${insight.related.length > 0 ? insight.related.join('، ') : '—'}`,
                'این داده خودکار در فیلدها نوشته نمی‌شود؛ فقط راهنمای تولید است.',
              ].join('\n')}
            </pre>
          ) : null}
          {error ? (
            <p
              role="alert"
              className="rounded-md border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.08)] p-3 text-xs text-[hsl(var(--destructive))]"
            >
              {error}
            </p>
          ) : null}
        </div>
      </EditorSection>

      {suggestion && rows.length > 0 ? (
        <EditorSection
          title={source === 'generate' ? 'آنچه در پیش‌نویس نوشته شد' : 'پیش‌نمایش تفاوت'}
          hint={
            source === 'generate'
              ? 'در تب‌ها ویرایش کنید؛ انتشار هنوز انجام نشده'
              : 'اعمال یا رد فیلد‌به‌فیلد — هرگز خودکار نیست'
          }
        >
          <div className="grid gap-3">
            {rows.map((key) => {
              const done = Boolean(applied[key])
              return (
                <article key={key} className={`${editorSurfaceClass} p-4`}>
                  <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">{SEO_FIELD_LABELS[key]}</h3>
                    {source === 'file' ? (
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
                    ) : (
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        {done ? 'در پیش‌نویس نشست' : 'پیشنهاد'}
                      </span>
                    )}
                  </header>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-[11px] text-[hsl(var(--muted-foreground))]">فعلی</p>
                      <pre className="whitespace-pre-wrap break-words rounded-md bg-[hsl(var(--surface-0))] p-3 text-xs leading-6">
                        {formatCurrent(key, draft, faqs, attributes, images)}
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
