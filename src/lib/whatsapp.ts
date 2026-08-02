import { buildWhatsAppUrl, SITE } from '@/lib/constants'

/** پیام پیش‌فرض مشاوره */
export function defaultConsultMessage(context?: string): string {
  const base = `سلام، از ${SITE.name} پیام می‌دهم.`
  if (context?.trim()) return `${base}\n${context.trim()}`
  return `${base} برای مشاورهٔ خرید تجهیزات اداری راهنمایی می‌خواهم.`
}

export function productQuoteMessage(model: string, name?: string): string {
  const label = name ? `${name} (${model})` : model
  return defaultConsultMessage(`درخواست استعلام قیمت برای: ${label}`)
}

export function cartQuoteMessage(lines: string[]): string {
  if (lines.length === 0) return defaultConsultMessage('دربارهٔ سبد خرید سوال دارم.')
  return defaultConsultMessage(
    `مایل به استعلام / هماهنگی سفارش هستم:\n${lines.map((l) => `• ${l}`).join('\n')}`
  )
}

export function openWhatsAppHref(message: string): string {
  return buildWhatsAppUrl(message)
}
