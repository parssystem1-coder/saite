import { describe, expect, it } from 'vitest'
import {
  PRODUCT_SEO_EXCLUDED_KEYS,
  PRODUCT_SEO_FILE_TYPE,
  PRODUCT_SEO_IMPORT_MAX_CHARS,
  PRODUCT_SEO_SCHEMA_VERSION,
  PRODUCT_SEO_TARGETS,
  SEO_PACK_ERRORS,
  buildProductSeoPack,
  parseProductSeoImport,
  productSeoPackFilename,
} from '@/lib/seo/product-seo-pack'
import { emptyProductSeoCurrent, SEO_SUGGESTION_KEYS } from '@/lib/seo/product-seo-suggestion'

const currentEmpty = emptyProductSeoCurrent()

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
    expect(pack.product.sku).toBe('')
    expect(pack.product.attributes).toEqual([])
    expect(pack.product.imageAlts).toEqual([])
    expect(pack.allowlist).toEqual(SEO_SUGGESTION_KEYS)
    expect(pack.suggestion?.name).toBe('پرینتر اچ پی M402')
    expect(pack.targets.seoTitle.max).toBe(PRODUCT_SEO_TARGETS.seoTitle.max)
    expect(pack.emptyFields).not.toContain('name')
    expect(pack.emptyFields).toContain('seoTitle')
    expect(pack.emptyFields).toContain('attributes')
    expect(pack.emptyFields).toContain('imageAlts')
    expect(pack.instructionsText).toMatch(/فقط یک شیء JSON برگردان/)
    expect(pack.instructionsText).toContain(PRODUCT_SEO_FILE_TYPE)
    expect(pack.instructionsText).toContain('schemaVersion')
    expect(pack.instructionsText).toMatch(/nameEn/)
    expect(pack.instructionsText).toMatch(/attributes/)
    expect(pack.instructionsText).toMatch(/قیمت، موجودی/)
    expect(pack.expectedResponse.fileType).toBe(PRODUCT_SEO_FILE_TYPE)
    expect(pack.expectedResponse.suggestion).toHaveProperty('name')
    expect(pack.expectedResponse.suggestion).toHaveProperty('attributes')
    expect(pack.expectedResponse.suggestion).toHaveProperty('imageAlts')
    expect(pack.promptPackId).toBe('product-seo.v1')
    const serialized = JSON.stringify(pack)
    for (const key of PRODUCT_SEO_EXCLUDED_KEYS) {
      expect(serialized).not.toContain(`"${key}"`)
    }
  })

  it('اکسپورت محصول پر را می‌توان دوباره ایمپورت کرد', () => {
    const pack = buildProductSeoPack({
      name: 'پرینتر اچ پی M402',
      slug: 'hp-m402',
      sku: 'HP-M402',
      brand: 'HP',
      current: {
        ...currentEmpty,
        name: 'پرینتر اچ پی M402',
        nameEn: 'HP LaserJet Pro M402',
        slug: 'hp-m402',
        sku: 'HP-M402',
        brand: 'HP',
        model: 'M402',
        category: 'printer',
        shortDescription: 'پرینتر لیزری اداری مناسب دفتر کوچک.',
        seoTitle: 'پرینتر اچ پی M402 | خرید و قیمت روز',
        seoDescription:
          'خرید پرینتر اچ پی M402 با گارانتی اصالت کالا و مشاوره تخصصی در فروشگاه ماشین‌های اداری سایت. مشخصات فنی و قیمت به‌روز.',
        focusKeyword: 'پرینتر اچ پی M402',
        canonicalUrl: '/products/hp-m402',
        faqs: [
          { question: 'گارانتی دارد؟', answer: 'بله، اصالت کالا تضمین می‌شود.' },
          { question: 'ارسال چند روزه است؟', answer: 'معمولاً یک روز کاری.' },
        ],
        attributes: [{ group: 'عملکرد', name: 'سرعت چاپ', value: '38', unit: 'ppm' }],
        imageAlts: ['پرینتر اچ پی M402 نمای جلو'],
      },
      emptyOnly: false,
    })

    expect(pack.product.sku).toBe('HP-M402')
    expect(pack.product.attributes[0]?.name).toBe('سرعت چاپ')
    expect(pack.suggestion?.faqs).toHaveLength(2)
    expect(pack.suggestion?.attributes?.[0]?.unit).toBe('ppm')
    expect(pack.suggestion?.imageAlts?.[0]).toMatch(/M402/)

    const parsed = parseProductSeoImport(JSON.stringify(pack))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.value.name).toBe('پرینتر اچ پی M402')
      expect(parsed.value.sku).toBe('HP-M402')
      expect(parsed.value.attributes).toHaveLength(1)
      expect(parsed.value.imageAlts).toEqual(['پرینتر اچ پی M402 نمای جلو'])
    }
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

  it('اکسپورت محصول کاملاً خالی را بدون suggestion رد می‌کند', () => {
    const pack = buildProductSeoPack({
      name: '',
      current: currentEmpty,
      emptyOnly: true,
    })
    expect(pack.suggestion).toBeUndefined()
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
