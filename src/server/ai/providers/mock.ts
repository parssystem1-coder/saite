import type {
  ProviderStreamEvent,
  ProviderStreamOptions,
} from '@/server/ai/stream-types'

export const mockAiProvider = {
  async chat(_opts: { feature: string; prompt: string; actorId: string }) {
    return {
      text: 'این یک پاسخ آزمایشی است — کلید API تنظیم نشده.',
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
