'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { requestAdminLogout } from '@/lib/auth/admin-login-client'
import { useAdminSessionStore } from '@/store/admin-session-store'

/**
 * خروج از پنل مدیریت.
 *
 * ── چرا سرور هم خبردار می‌شود ─────────────────────────────────
 * نسخهٔ قبلی فقط state کلاینت را پاک می‌کرد. اما نشست واقعی در
 * کوکی سرور است: بدون `DELETE /admin/api/session` کاربر «خارج
 * شده» بود ولی کوکی‌اش هنوز معتبر بود — کافی بود صفحه را رفرش
 * کند تا دوباره داخل باشد.
 *
 * ── چرا `replace` و نه `push`؟ ────────────────────────────────
 * تا کاربر با دکمهٔ Back مرورگر به صفحهٔ پنل برنگردد و لحظه‌ای
 * محتوای کش‌شده را نبیند.
 *
 * ── چرا `refresh`؟ ────────────────────────────────────────────
 * تا Server Componentها دوباره اجرا شوند و کش مسیر با وضعیت
 * «بدون نشست» به‌روز شود.
 */
export function AdminSignOut({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const clear = useAdminSessionStore((s) => s.clear)
  const [isPending, setIsPending] = React.useState(false)

  const handleSignOut = React.useCallback(async () => {
    setIsPending(true)

    // ابطال کوکی سرور — بدون این، نشست واقعاً بسته نمی‌شود
    await requestAdminLogout()

    clear()
    onNavigate?.()
    router.refresh()
    router.replace('/admin/login')
  }, [clear, onNavigate, router])

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={isPending}
      className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="size-4" />
      {isPending ? 'در حال خروج…' : 'خروج از پنل'}
    </Button>
  )
}
