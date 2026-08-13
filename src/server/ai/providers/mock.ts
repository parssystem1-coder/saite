import type {
  ProviderStreamEvent,
  ProviderStreamOptions,
} from '@/server/ai/stream-types'

function mockProductSeoJson(prompt: string): string {
  const nameMatch = prompt.match(/نام:\s*(.+)/)
  const rawName = (nameMatch?.[1] ?? 'پرینتر لیزری').trim()
  const name = rawName.slice(0, 24) || 'پرینتر لیزری'
  const keyword = `${name} خرید`.slice(0, 40)
  const title = `${name} | خرید و قیمت`.slice(0, 60)
  const description =
    `خرید ${name} با گارانتی اصالت کالا، مشاوره تخصصی و ارسال سریع از فروشگاه ماشین‌های اداری سایت. مشخصات فنی و قیمت به‌روز را همین‌جا مقایسه کنید.`.slice(
      0,
      160
    )

  return JSON.stringify({
    seoTitle: title,
    seoDescription: description,
    focusKeyword: keyword,
    faqs: [
      {
        question: `آیا ${name} گارانتی اصالت دارد؟`,
        answer: 'بله. کالا با گارانتی اصالت و خدمات پس از فروش عرضه می‌شود.',
      },
      {
        question: 'زمان آماده‌سازی سفارش چقدر است؟',
        answer: 'معمولاً یک روز کاری؛ وضعیت موجودی در صفحهٔ محصول مشخص است.',
      },
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
