'use client'

import { usePathname } from 'next/navigation'
import {
  InstagramGlyph,
  PhoneGlyph,
  WhatsAppGlyph,
} from '@/components/layout/contact-fab-icons'
import { useCompareHydrated } from '@/hooks/use-has-hydrated'
import {
  getContactFabConfig,
  getEnabledContactFabChannels,
  type ContactFabChannelConfig,
  type ContactFabChannelId,
} from '@/lib/contact-fab-config'
import { buildInstagramUrl, SITE } from '@/lib/constants'
import { isFloatingChromeHidden } from '@/lib/layout/floating-chrome'
import { cn } from '@/lib/utils'
import { defaultConsultMessage, openWhatsAppHref, productQuoteMessage } from '@/lib/whatsapp'
import { useCompareStore } from '@/store/compare-store'

type ChannelVisual = {
  Glyph: (p: { className?: string }) => React.ReactNode
  /** کلاس پس‌زمینه و سایهٔ برند */
  shell: string
  ring: string
}

const CHANNEL_VISUAL: Record<ContactFabChannelId, ChannelVisual> = {
  whatsapp: {
    Glyph: WhatsAppGlyph,
    shell:
      'bg-[#25D366] text-white shadow-[0_4px_14px_rgba(37,211,102,0.45)] hover:bg-[#20bd5a] hover:shadow-[0_6px_20px_rgba(37,211,102,0.55)]',
    ring: 'focus-visible:ring-[#25D366]',
  },
  instagram: {
    Glyph: InstagramGlyph,
    shell:
      'bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-[0_4px_14px_rgba(238,42,123,0.4)] hover:brightness-110 hover:shadow-[0_6px_20px_rgba(238,42,123,0.5)]',
    ring: 'focus-visible:ring-[#ee2a7b]',
  },
  phone: {
    Glyph: PhoneGlyph,
    shell:
      'bg-primary text-primary-foreground shadow-[0_4px_14px_hsl(var(--primary)/0.45)] hover:bg-primary-bright hover:shadow-[0_6px_20px_hsl(var(--primary)/0.55)]',
    ring: 'focus-visible:ring-primary',
  },
}

function resolveHref(channel: ContactFabChannelConfig, pathname: string): string {
  switch (channel.id) {
    case 'whatsapp': {
      let message = defaultConsultMessage()
      const productMatch = pathname.match(/^\/products\/([^/]+)/)
      if (productMatch?.[1]) {
        message = productQuoteMessage(decodeURIComponent(productMatch[1]))
      } else if (pathname.startsWith('/cart') || pathname.startsWith('/checkout')) {
        message = defaultConsultMessage('دربارهٔ سبد خرید / سفارش سوال دارم.')
      } else if (pathname.startsWith('/contact')) {
        message = defaultConsultMessage('از صفحهٔ تماس پیام می‌دهم.')
      }
      // value اختیاری: اگر شمارهٔ سفارشی در تنظیمات باشد بعداً می‌توان به buildWhatsAppUrl افزود
      return openWhatsAppHref(message)
    }
    case 'instagram': {
      const raw = channel.value.trim() || SITE.instagram
      return buildInstagramUrl(raw)
    }
    case 'phone': {
      const tel = (channel.value.trim() || SITE.phoneLtr).replace(/\s/g, '')
      return `tel:${tel}`
    }
    default:
      return '#'
  }
}

/**
 * نوار شناور تماس — سه دکمهٔ گرد عمودی (واتساپ / اینستا / تماس).
 *
 * پیکربندی از `getContactFabConfig()` می‌آید تا بعداً از پنل تنظیمات
 * مدیریت شود (فعال/غیرفعال، ترتیب، لینک‌ها).
 */
export function ContactFab() {
  const pathname = usePathname() ?? '/'
  const compareReady = useCompareHydrated()
  const compareCount = useCompareStore((s) => s.items.length)
  const config = getContactFabConfig()

  if (!config.enabled) return null
  if (isFloatingChromeHidden(pathname, config.hideOnPathPrefixes)) return null

  const channels = getEnabledContactFabChannels(config)
  if (channels.length === 0) return null

  // وقتی نوار مقایسه باز است، ستون را بالاتر می‌کشیم
  const compareOpen = compareReady && compareCount > 0

  return (
    <nav
      aria-label="راه‌های تماس سریع"
      className={cn(
        'pointer-events-none fixed z-40 flex flex-col items-center gap-3',
        'left-4 md:left-6',
        compareOpen ? 'bottom-24 md:bottom-28' : 'bottom-5 md:bottom-8'
      )}
    >
      {/* پوستهٔ شیشه‌ای حرفه‌ای */}
      <div
        className={cn(
          'pointer-events-auto flex flex-col items-center gap-2.5 rounded-full p-2',
          'border border-border bg-surface-1/75 shadow-depth-4 backdrop-blur-xl',
          'supports-[backdrop-filter]:bg-surface-1/60'
        )}
      >
        {channels.map((channel) => {
          const visual = CHANNEL_VISUAL[channel.id]
          const href = resolveHref(channel, pathname)
          const external = channel.id !== 'phone'
          const Glyph = visual.Glyph

          return (
            <a
              key={channel.id}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              aria-label={channel.ariaLabel}
              title={channel.label}
              className={cn(
                'group relative flex size-12 items-center justify-center rounded-full md:size-[3.25rem]',
                'transition-all duration-200 ease-out',
                'hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                visual.shell,
                visual.ring
              )}
            >
              <Glyph className="size-[1.35rem] md:size-6" />
              {/* برچسب شناور دسکتاپ — فقط hover */}
              <span
                className={cn(
                  'pointer-events-none absolute top-1/2 right-full z-10 me-3 -translate-y-1/2',
                  'hidden whitespace-nowrap rounded-lg border border-border bg-surface-3 px-2.5 py-1',
                  'text-[11px] font-bold text-foreground shadow-depth-2',
                  'opacity-0 transition-opacity duration-150',
                  'md:block md:group-hover:opacity-100 md:group-focus-visible:opacity-100'
                )}
              >
                {channel.label}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
