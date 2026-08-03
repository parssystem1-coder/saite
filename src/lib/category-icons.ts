import { Copy, Droplets, Printer, ScanLine, Send, Wrench } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * نگاشت نام آیکون دسته‌بندی به کامپوننت lucide.
 *
 * چرا منبع واحد؟ این شیء پیش از این در سه فایل تکرار شده بود
 * (`app/page.tsx`، `design-system-client.tsx`، `mega-menu.tsx`).
 * افزودن یک دستهٔ جدید یعنی ویرایش هر سه — و فراموش‌کردن یکی،
 * آیکون گمشده در همان صفحه.
 *
 * `Category.icon` در `lib/constants` رشته است (نه کامپوننت) تا
 * بتوان آن را از API خواند؛ این ماژول پل بین آن رشته و آیکون است.
 */
export const CATEGORY_ICONS = {
  Printer,
  ScanLine,
  Copy,
  Send,
  Droplets,
  Wrench,
} as const

export type CategoryIconName = keyof typeof CATEGORY_ICONS

/** آیکون پیش‌فرض اگر نام ناشناخته بود — به‌جای رندر undefined */
const FALLBACK_ICON: LucideIcon = Printer

export function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name as CategoryIconName] ?? FALLBACK_ICON
}
