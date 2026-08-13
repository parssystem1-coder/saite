import { describe, expect, it } from 'vitest'
import {
  PRODUCT_SEO_FILE_TYPE,
  PRODUCT_SEO_IMPORT_MAX_CHARS,
  PRODUCT_SEO_SCHEMA_VERSION,
  PRODUCT_SEO_TARGETS,
  SEO_PACK_ERRORS,
  buildProductSeoPack,
  parseProductSeoImport,
  productSeoPackFilename,
} from '@/lib/seo/product-seo-pack'

const currentEmpty = {
  seoTitle: '',
  seoDescription: '',
  focusKeyword: '',
  canonicalUrl: '',
  faqs: [] as Array<{ question: string; answer: string }>,
}

const validSuggestion = {
  seoTitle: 'پرینتر اچ پی M402 | خرید و قیمت روز',
  seoDescription:
    'خرید پرینتر اچ پی M402 با گارانتی اصالت کالا و مشاوره تخصصی در فروشگاه ماشین‌های اداری سایت. مشخصات فنی و قیمت به‌روز.',
  focusKeyword: 'پرینتر اچ پی M402',
  faqs: [
    { question: 'گارانتی دارد؟', answer: 'بله، اصالت کالا تضمین می‌شود.' },
    { question: 'ارسال چند روزه است؟', answer: 'معمولاً یک روز کاری.' },
  ],
}

function wrap(suggestion: unknown, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    fileType: PRODUCT_SEO_FILE_TYPE,
    schemaVersion: PRODUCT_SEO_SCHEMA_VERSION,
    suggestion,
    ...extra,
  })
}

describe('buildProductSeoPack', () => {
  it('قرارداد نسخه‌دار و دستور فارسی برای مدل خارجی می‌سازد', () => {
    const pack = buildProductSeoPack(
      {
        name: 'پرینتر اچ پی M402',
        slug: 'hp-m402',
        brand: 'HP',
        current: currentEmpty,
        emptyOnly: true,
      },
      new Date('2026-08-13T10:00:00.000Z')
    )

    expect(pack.fileType).toBe(PRODUCT_SEO_FILE_TYPE)
    expect(pack.schemaVersion).toBe(1)
    expect(pack.exportedAt).toBe('2026-08-13T10:00:00.000Z')
    expect(pack.product.name).toBe('پرینتر اچ پی M402')
    expect(pack.targets.seoTitle.max).toBe(PRODUCT_SEO_TARGETS.seoTitle.max)
    expect(pack.emptyFields).toEqual([
      'seoTitle',
      'seoDescription',
      'focusKeyword',
      'canonicalUrl',
      'faqs',
    ])
    expect(pack.instructionsText).toMatch(/فقط یک شیء JSON برگردان/)
    expect(pack.instructionsText).toContain(PRODUCT_SEO_FILE_TYPE)
    expect(pack.instructionsText).toContain('schemaVersion')
    expect(pack.expectedResponse.fileType).toBe(PRODUCT_SEO_FILE_TYPE)
    expect(pack.promptPackId).toBe('product-seo.v1')
    expect(JSON.stringify(pack)).not.toMatch(/costToman|priceToman/)
  })

  it('دستور بستهٔ سازمانی را در فایل اکسپورت می‌آورد', () => {
    const pack = buildProductSeoPack({
      name: 'پرینتر',
      current: currentEmpty,
      emptyOnly: true,
      promptPackId: 'product-seo.commercial.v1',
    })
    expect(pack.promptPackId).toBe('product-seo.commercial.v1')
    expect(pack.instructionsText).toMatch(/سازمانی/)
  })

  it('نام فایل را فقط با اسلاگ امن می‌سازد', () => {
    expect(productSeoPackFilename('HP Laser/M402')).toBe('saite-product-seo-hp-laser-m402.json')
    expect(productSeoPackFilename('پرینتر')).toBe('saite-product-seo.json')
  })
})

describe('parseProductSeoImport', () => {
  it('پوشش suggestion را می‌پذیرد', () => {
    const parsed = parseProductSeoImport(wrap(validSuggestion))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.value.seoTitle).toBe(validSuggestion.seoTitle)
      expect(parsed.value.faqs).toHaveLength(2)
    }
  })

  it('کلید result و فیلدهای ریشه را هم می‌خواند', () => {
    const viaResult = parseProductSeoImport(
      JSON.stringify({
        fileType: PRODUCT_SEO_FILE_TYPE,
        schemaVersion: 1,
        result: { seoTitle: validSuggestion.seoTitle },
      })
    )
    expect(viaResult.ok).toBe(true)

    const viaRoot = parseProductSeoImport(
      JSON.stringify({
        fileType: PRODUCT_SEO_FILE_TYPE,
        schemaVersion: 1,
        focusKeyword: validSuggestion.focusKeyword,
      })
    )
    expect(viaRoot.ok).toBe(true)
  })

  it('فنس markdown را جدا می‌کند', () => {
    const parsed = parseProductSeoImport(`پاسخ مدل\n\`\`\`json\n${wrap(validSuggestion)}\n\`\`\``)
    expect(parsed.ok).toBe(true)
  })

  it('تگ HTML را از متن پاک می‌کند و تفسیر نمی‌کند', () => {
    const parsed = parseProductSeoImport(
      wrap({
        ...validSuggestion,
        focusKeyword: '<b>پرینتر اچ پی M402</b>',
      })
    )
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.value.focusKeyword).toBe('پرینتر اچ پی M402')
  })

  it('فایل خام اکسپورت بدون suggestion را رد می‌کند', () => {
    const pack = buildProductSeoPack({
      name: 'پرینتر',
      current: currentEmpty,
      emptyOnly: true,
    })
    const parsed = parseProductSeoImport(JSON.stringify(pack))
    expect(parsed).toEqual({ ok: false, message: SEO_PACK_ERRORS.noSuggestion })
  })

  it('schemaVersion و fileType را اجباری می‌داند', () => {
    expect(
      parseProductSeoImport(JSON.stringify({ schemaVersion: 1, suggestion: validSuggestion }))
    ).toEqual({ ok: false, message: SEO_PACK_ERRORS.fileType })

    expect(
      parseProductSeoImport(
        JSON.stringify({ fileType: PRODUCT_SEO_FILE_TYPE, suggestion: validSuggestion })
      )
    ).toEqual({ ok: false, message: SEO_PACK_ERRORS.schemaVersion })

    expect(
      parseProductSeoImport(
        JSON.stringify({
          fileType: PRODUCT_SEO_FILE_TYPE,
          schemaVersion: 2,
          suggestion: validSuggestion,
        })
      )
    ).toEqual({ ok: false, message: SEO_PACK_ERRORS.schemaVersion })
  })

  it('کلید غیرمجاز داخل suggestion را رد می‌کند', () => {
    const parsed = parseProductSeoImport(
      wrap({ ...validSuggestion, price: 1, description: '<p>نوشتن در DB</p>' })
    )
    expect(parsed).toEqual({ ok: false, message: SEO_PACK_ERRORS.suggestionShape })
  })

  it('canonical ناامن را رد می‌کند', () => {
    const parsed = parseProductSeoImport(
      wrap({ seoTitle: validSuggestion.seoTitle, canonicalUrl: 'javascript:alert(1)' })
    )
    expect(parsed).toEqual({ ok: false, message: SEO_PACK_ERRORS.suggestionShape })
  })

  it('حجم بیش از سقف را رد می‌کند', () => {
    const parsed = parseProductSeoImport('x'.repeat(PRODUCT_SEO_IMPORT_MAX_CHARS + 1))
    expect(parsed).toEqual({ ok: false, message: SEO_PACK_ERRORS.tooLarge })
  })

  it('JSON خراب را رد می‌کند', () => {
    expect(parseProductSeoImport('این فقط متن است')).toEqual({
      ok: false,
      message: SEO_PACK_ERRORS.notJson,
    })
  })
})
