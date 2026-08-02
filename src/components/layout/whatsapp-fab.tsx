'use client'

import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { defaultConsultMessage, openWhatsAppHref, productQuoteMessage } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

/**
 * دکمهٔ شناور واتساپ — کانال اصلی تبدیل B2B در ایران.
 * متن پیام بر اساس مسیر صفحه ازپیش‌پر می‌شود.
 */
export function WhatsAppFab() {
  const pathname = usePathname() ?? '/'

  // پنل ادمین: دکمه را نشان نده
  if (pathname.startsWith('/admin')) return null

  let message = defaultConsultMessage()
  const productMatch = pathname.match(/^\/products\/([^/]+)/)
  if (productMatch?.[1] && productMatch[1] !== '') {
    const slug = decodeURIComponent(productMatch[1])
    message = productQuoteMessage(slug)
  } else if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) {
    message = defaultConsultMessage('دربارهٔ سبد خرید / سفارش سوال دارم.')
  } else if (pathname.startsWith('/contact')) {
    message = defaultConsultMessage('از صفحهٔ تماس پیام می‌دهم.')
  }

  const href = openWhatsAppHref(message)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="گفتگو در واتساپ"
      className={cn(
        'fixed z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-bold text-white',
        'shadow-[0_4px_0_0_#1da851,0_8px_24px_rgba(37,211,102,0.35)]',
        'transition-transform hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_1px_0_0_#1da851]',
        // بالای نوار مقایسه (اگر باز باشد)
        'bottom-6 left-4 md:bottom-8 md:left-8',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <MessageCircle className="size-5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline">مشاوره در واتساپ</span>
    </a>
  )
}
