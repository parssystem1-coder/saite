/**
 * پیکربندی نوار شناور تماس (واتساپ / اینستاگرام / تلفن).
 *
 * ── آماده‌سازی پنل تنظیمات ────────────────────────────────────
 * فعلاً از این ثابت خوانده می‌شود. در فاز بک‌اند، `getContactFabConfig()`
 * می‌تواند از API/DB بیاید و همین شکل را برگرداند؛ UI عوض نمی‌شود.
 */

import { FLOATING_CHROME_HIDDEN_PREFIXES } from '@/lib/layout/floating-chrome'

export type ContactFabChannelId = 'whatsapp' | 'instagram' | 'phone'

export interface ContactFabChannelConfig {
  id: ContactFabChannelId
  /** نمایش در UI و پنل تنظیمات */
  label: string
  /** aria-label کامل برای دسترس‌پذیری */
  ariaLabel: string
  /** اگر false باشد دکمه رندر نمی‌شود */
  enabled: boolean
  /** ترتیب عمودی — عدد کمتر = بالاتر */
  order: number
  /**
   * مقصد:
   * - whatsapp: فقط اگر خالی باشد از SITE + پیام پیش‌فرض استفاده می‌شود
   * - instagram: یوزرنیم بدون @ یا URL کامل
   * - phone: شمارهٔ tel (ترجیحاً E.164 مثل +9821...)
   */
  value: string
}

export interface ContactFabConfig {
  /** خاموش/روشن کل نوار */
  enabled: boolean
  /** مخفی در مسیرهایی که با این پیشوند شروع می‌شوند */
  hideOnPathPrefixes: string[]
  channels: ContactFabChannelConfig[]
}

/**
 * پیش‌فرض فروشگاه — بعداً از /admin/settings قابل ویرایش خواهد بود.
 */
export const DEFAULT_CONTACT_FAB_CONFIG: ContactFabConfig = {
  enabled: true,
  // منبع واحد با CompareBar — تعریف در lib/layout/floating-chrome
  hideOnPathPrefixes: [...FLOATING_CHROME_HIDDEN_PREFIXES],
  channels: [
    {
      id: 'whatsapp',
      label: 'واتساپ',
      ariaLabel: 'مشاوره در واتساپ',
      enabled: true,
      order: 1,
      value: '', // خالی = SITE.whatsappE164 + پیام مشاوره
    },
    {
      id: 'instagram',
      label: 'اینستاگرام',
      ariaLabel: 'صفحهٔ اینستاگرام فروشگاه',
      enabled: true,
      order: 2,
      value: 'saite.office', // یوزرنیم نمونه — در تنظیمات عوض شود
    },
    {
      id: 'phone',
      label: 'تماس',
      ariaLabel: 'تماس تلفنی با فروشگاه',
      enabled: true,
      order: 3,
      value: '', // خالی = SITE.phoneLtr
    },
  ],
}

/**
 * منبع فعلی پیکربندی.
 * آماده‌سازی فاز بعد: async از API بخوانید و cache کنید.
 */
export function getContactFabConfig(): ContactFabConfig {
  return DEFAULT_CONTACT_FAB_CONFIG
}

/** کانال‌های فعال، مرتب‌شده از بالا به پایین */
export function getEnabledContactFabChannels(
  config: ContactFabConfig = getContactFabConfig()
): ContactFabChannelConfig[] {
  if (!config.enabled) return []
  return [...config.channels]
    .filter((c) => c.enabled)
    .sort((a, b) => a.order - b.order)
}
