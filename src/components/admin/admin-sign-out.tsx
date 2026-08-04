'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'

/**
 * خروج از پنل مدیریت.
 *
 * چرا `replace` و نه `push`؟ تا کاربر با دکمهٔ Back مرورگر به صفحهٔ
 * پنل برنگردد. صفحه دوباره گارد را رد نمی‌کند، اما لحظه‌ای محتوای
 * کش‌شده دیده می‌شود که تجربهٔ بدی است.
 *
 * ── فاز بک‌اند ────────────────────────────────────────────────
 * علاوه بر پاک‌کردن state، باید `POST /api/auth/logout` صدا زده شود
 * تا کوکی session سمت سرور هم باطل شود. پاک‌کردن state کلاینت
 * به‌تنهایی یعنی نشست روی سرور همچنان معتبر است.
 */
export function AdminSignOut({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)

  const handleSignOut = React.useCallback(() => {
    logout()
    onNavigate?.()
    router.replace('/admin/login')
  }, [logout, onNavigate, router])

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="size-4" />
      خروج از پنل
    </Button>
  )
}
