import type {
  ProviderStreamEvent,
  ProviderStreamOptions,
} from '@/server/ai/stream-types'

function mockLongDescription(name: string): string {
  const paragraph = `${name} برای محیط اداری و سازمانی طراحی شده و در فروشگاه ماشین‌های اداری سایت با مشاوره تخصصی عرضه می‌شود. مشخصات فنی را با نیاز مجموعه خود مقایسه کنید و برای سازگاری مواد مصرفی از کارشناس فروش کمک بگیرید. `
  return paragraph.repeat(40).trim()
}

function mockProductSeoJson(prompt: string): string {
  const nameMatch = prompt.match(/نام:\s*(.+)/)
  const rawName = (nameMatch?.[1] ?? 'پرینتر لیزری').trim()
  const name = rawName === '—' ? 'پرینتر لیزری' : rawName.slice(0, 48) || 'پرینتر لیزری'
  const keyword = `${name} خرید`.slice(0, 40)
  const title = `${name} | خرید و قیمت`.slice(0, 60)
  const description =
    `خرید ${name} با مشاوره تخصصی و ارسال از فروشگاه ماشین‌های اداری سایت. مشخصات فنی را همین‌جا مقایسه کنید و برای انتخاب مدل مناسب راهنمایی بگیرید.`.slice(
      0,
      160
    )

  return JSON.stringify({
    name,
    nameEn: 'Office Printer',
    slug: 'office-printer',
    sku: 'SAITE-PRINTER',
    brand: 'HP',
    category: 'printer',
    subCategory: 'laser-mono',
    model: 'M402',
    series: 'LaserJet Pro',
    shortDescription: `${name} مناسب چاپ روزمره اداری با کیفیت پایدار و هزینهٔ نگهداری قابل پیش‌بینی است.`,
    longDescription: mockLongDescription(name),
    seoTitle: title,
    seoDescription: description,
    focusKeyword: keyword,
    canonicalUrl: '/products/office-printer',
    faqs: [
      {
        question: `آیا ${name} برای دفتر مناسب است؟`,
        answer: 'بله. این مدل برای چاپ روزمره اداری و حجم کاری متوسط طراحی شده است.',
      },
      {
        question: 'مواد مصرفی آن در فروشگاه هست؟',
        answer: 'تونر و قطعات سازگار معمولاً در همین فروشگاه قابل استعلام است.',
      },
      {
        question: 'چطور مدل درست را انتخاب کنیم؟',
        answer: 'برند، مدل و حجم چاپ ماهانه را با کارشناس فروش در میان بگذارید.',
      },
    ],
    attributes: [
      { group: 'چاپ و عملکرد', name: 'تکنولوژی چاپ', value: 'لیزری', unit: '' },
      { group: 'چاپ و عملکرد', name: 'نوع چاپ', value: 'تک‌رنگ', unit: '' },
    ],
  })
}

export const mockAiProvider = {
  async chat(opts: { feature: string; prompt: string; actorId: string }) {
    const text =
      opts.feature === 'product-seo'
        ? mockProductSeoJson(opts.prompt)
        : 'این یک پاسخ آزمایشی است — کلید API تنظیم نشده.'
    return {
      text,
      usage: { inputTokens: 0, outputTokens: 0 },
      durationMs: 0,
    }
  },

  /**
   * استریم ساختگی برای توسعه/تست — بدون کلید API.
   * در production با نبود کلید، gateway پیش از رسیدن به اینجا
   * ServiceUnavailableError پرتاب می‌کند.
   */
  async *chatStream(_opts: ProviderStreamOptions): AsyncGenerator<ProviderStreamEvent> {
    const chunks = ['سلام! ', 'من مشاور فروش آزمایشی سایته هستم ', '— کلید API تنظیم نشده است.']
    for (const chunk of chunks) {
      yield { type: 'delta', text: chunk }
    }
    yield { type: 'done', inputTokens: 0, outputTokens: 0 }
  },

  async embedding(_text: string) {
    return new Array(1536).fill(0)
  },
}
