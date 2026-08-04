'use client'

import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useHasHydrated } from '@/hooks/use-has-hydrated'
import { isFloatingChromeHidden } from '@/lib/layout/floating-chrome'
import { useAdminSessionStore } from '@/store/admin-session-store'

/**
 * نوار اعلان نشست مدیر در فروشگاه.
 *
 * ── چرا لازم است؟ ─────────────────────────────────────────────
 * نشست مدیر و نشست مشتری کاملاً جدا هستند. اگر مدیری که وارد پنل
 * شده به فروشگاه بیاید، هدر او را «مهمان» نشان می‌دهد — که درست
 * است اما می‌تواند گیج‌کننده باشد («مگر وارد نشدم؟»).
 *
 * این نوار آن ابهام را رفع می‌کند: صریح می‌گوید نشست مدیر فعال
 * است اما این بخش فروشگاه است و خرید نیازمند حساب مشتری است.
 *
 * در خود پنل نمایش داده نمی‌شود (آنجا بدیهی است).
 */
export function AdminSessionBar() {
  const pathname = usePathname()
  const hydrated = useHasHydrated()
  const isAdminAuthenticated = useAdminSessionStore((s) => s.isAdminAuthenticated)
  const admin = useAdminSessionStore((s) => s.admin)

  // در پنل مدیریت لازم نیست؛ پیش از hydration هم چیزی نشان نمی‌دهیم
  // تا HTML سرور و کلاینت یکی بماند.
  if (!hydrated || !isAdminAuthenticated) return null
  if (isFloatingChromeHidden(pathname)) return null

  return (
    <div className="border-b border-primary/25 bg-primary/10">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[11px] md:text-xs">
        <span className="flex items-center gap-1.5 font-bold text-primary">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
          نشست مدیر فعال است{admin?.name ? ` — ${admin.name}` : ''}
        </span>
        <span aria-hidden="true" className="hidden text-muted-foreground/40 sm:inline">
          |
        </span>
        <span className="text-muted-foreground">
          این بخش فروشگاه است؛ خرید با حساب مشتری انجام می‌شود.
        </span>
        <Link
          href="/admin"
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          بازگشت به پنل
        </Link>
      </div>
    </div>
  )
}
