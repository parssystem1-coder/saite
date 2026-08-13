import 'server-only'

/**
 * تایپ‌های مشترک استریم چت بین gateway و providerها.
 *
 * ── چرا فایل جدا؟ ─────────────────────────────────────────────
 * gateway از providerها import می‌کند؛ providerها نباید gateway را
 * import کنند (چرخه). انواع قرارداد استریم اینجا زندگی می‌کنند تا
 * هر دو سمت به یک منبع واحد ارجاع دهند.
 */

export interface StreamChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** رویدادهای جریان — تکه متن یا پایانِ موفق با شمارش توکن */
export type ProviderStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; inputTokens: number; outputTokens: number }

export interface ProviderStreamOptions {
  feature: string
  /** system promptِ ساخته‌شده در سرور (پاکسازی PII انجام شده) */
  system: string
  /** تاریخچهٔ گفتگو + پیام جدید کاربر (پاکسازی PII انجام شده) */
  messages: StreamChatMessage[]
  maxTokens?: number
  actorId: string
}

/** هر providerِ پشتیبانی‌کننده از استریم این امضا را دارد */
export interface StreamingChatProvider {
  chatStream(opts: ProviderStreamOptions): AsyncGenerator<ProviderStreamEvent>
}
