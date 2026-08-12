import type { ProductCardData } from '@/types/product'

/**
 * تایپ‌های مشترک کلاینتِ چت مشاور فروش.
 *
 * فقط «شکل داده» — هیچ منطق سروری اینجا نیست تا از کلاینت
 * قابل import باشد. رویدادهای SSE باید با آنچه روت سرور می‌فرستد
 * (src/app/api/ai/advisor/route.ts) سنک بمانند.
 */

export interface ChatMessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** فقط محصولاتی که سرور با دیتابیس اعتبارسنجی کرده */
  products?: ProductCardData[]
  isError?: boolean
}

/** رویدادهای SSE که کلاینت می‌فهمد */
export type AdvisorSseEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string; products: ProductCardData[] }
  | { type: 'error'; message: string }

function isProductCardData(value: unknown): value is ProductCardData {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.id === 'string' &&
    typeof p.slug === 'string' &&
    typeof p.name === 'string' &&
    typeof p.brand === 'string' &&
    typeof p.model === 'string' &&
    Array.isArray(p.images)
  )
}

/**
 * پارسر امن یک بلاک SSE به رویداد تایپ‌دار.
 * دادهٔ ناشناس/خراب null برمی‌گرداند و در UI نادیده گرفته می‌شود —
 * فقط شکل مورد انتظار قرارداد پذیرفته می‌شود.
 */
export function parseAdvisorSseBlock(rawBlock: string): AdvisorSseEvent | null {
  const lines = rawBlock.split('\n')
  const eventLine = lines.find((l) => l.startsWith('event:'))
  const dataLines = lines.filter((l) => l.startsWith('data:'))
  if (!eventLine || dataLines.length === 0) return null

  const eventName = eventLine.slice('event:'.length).trim()
  let data: unknown
  try {
    data = JSON.parse(dataLines.map((l) => l.slice('data:'.length).trim()).join('\n'))
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>

  switch (eventName) {
    case 'session':
      return typeof d.sessionId === 'string' ? { type: 'session', sessionId: d.sessionId } : null
    case 'delta':
      return typeof d.text === 'string' ? { type: 'delta', text: d.text } : null
    case 'done': {
      if (typeof d.text !== 'string') return null
      const products = Array.isArray(d.products) ? d.products.filter(isProductCardData) : []
      return { type: 'done', text: d.text, products }
    }
    case 'error':
      return typeof d.message === 'string'
        ? { type: 'error', message: d.message }
        : { type: 'error', message: 'خطای غیرمنتظره رخ داد.' }
    default:
      return null
  }
}
