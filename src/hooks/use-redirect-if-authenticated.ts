'use client'

import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useHasHydrated } from '@/hooks/use-has-hydrated'

/**
 * اگر کاربر از قبل وارد است، صفحهٔ ورود را نشان نده.
 *
 * ── چرا لازم است؟ ─────────────────────────────────────────────
 * کاربری که وارد است و دوباره `/login` را باز می‌کند، فرم خالی
 * می‌بیند. سه مشکل:
 *   ۱. گیج‌کننده است — «مگر وارد نبودم؟»
 *   ۲. ممکن است ناخواسته نشست دیگری بسازد
 *   ۳. اگر رمز را در فرم بنویسد، بی‌دلیل در حافظهٔ مرورگر می‌ماند
 *
 * ── چرا `replace` و نه `push`؟ ────────────────────────────────
 * تا دکمهٔ Back مرورگر کاربر را به صفحهٔ ورود برنگرداند و در
 * حلقهٔ رفت‌وبرگشت نیفتد.
 *
 * @returns آیا باید محتوا رندر شود؟ (false = در حال ریدایرکت)
 */
export function useRedirectIfAuthenticated(
  isAuthenticated: boolean,
  destination: string
): boolean {
  const router = useRouter()
  const hydrated = useHasHydrated()

  React.useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(destination)
  }, [hydrated, isAuthenticated, destination, router])

  // پیش از hydration وضعیت ورود قطعی نیست، پس رندر می‌کنیم تا
  // HTML سرور و کلاینت یکی بماند و hydration mismatch نشود.
  return !hydrated || !isAuthenticated
}
