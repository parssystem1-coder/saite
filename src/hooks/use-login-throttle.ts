'use client'

import * as React from 'react'

/**
 * محدودیت تلاش ورود — منطق مشترک فرم مدیر و مشتری.
 *
 * ── چرا مشترک شد؟ ─────────────────────────────────────────────
 * منطق قفل ابتدا فقط در فرم مدیر بود. اما حساب مشتری هم نشانی
 * پستی، شمارهٔ تماس و تاریخچهٔ خرید دارد — حملهٔ حدس رمز روی آن
 * هم باید کند شود. به‌جای کپی کردن کد، اینجا متمرکز شد.
 *
 * ── محدودیت صادقانه ───────────────────────────────────────────
 * این قفل در حافظهٔ کامپوننت است: با رفرش صفحه پاک می‌شود. پس
 * مهاجم خودکار را متوقف نمی‌کند، فقط حدس دستی را کند می‌کند و
 * به کاربر واقعی هشدار می‌دهد.
 *
 * محافظت واقعی سمت سرور است:
 *   • rate limit روی IP و نام کاربری (مثلاً ۵ تلاش در ۱۵ دقیقه)
 *   • قفل حساب پس از N شکست پیاپی + اطلاع‌رسانی به کاربر
 *   • تأخیر تصاعدی (exponential backoff)
 *   • CAPTCHA پس از چند شکست
 */

export interface LoginThrottleOptions {
  maxAttempts: number
  lockoutSeconds: number
}

export interface LoginThrottle {
  /** آیا فرم الان قفل است؟ */
  isLocked: boolean
  /** ثانیه‌های باقی‌مانده تا باز شدن */
  secondsLeft: number
  /** تلاش‌های باقی‌مانده پیش از قفل */
  remainingAttempts: number
  /** آیا باید هشدار «چند تلاش مانده» نشان داده شود؟ */
  showWarning: boolean
  /** پس از هر شکست صدا زده شود */
  registerFailure: () => void
  /** پس از ورود موفق صدا زده شود */
  reset: () => void
}

export function useLoginThrottle({
  maxAttempts,
  lockoutSeconds,
}: LoginThrottleOptions): LoginThrottle {
  const [attempts, setAttempts] = React.useState(0)
  /** شمارندهٔ ثانیه به‌جای timestamp — تا رندر خالص بماند */
  const [secondsLeft, setSecondsLeft] = React.useState(0)

  const isLocked = secondsLeft > 0

  /*
    شمارش معکوس.

    از نگه‌داشتن timestamp و مقایسه با Date.now() در بدنهٔ رندر
    پرهیز می‌کنیم چون Date.now تابع ناخالص است و رندر را
    غیرقابل‌پیش‌بینی می‌کند.
  */
  React.useEffect(() => {
    if (secondsLeft <= 0) return

    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setAttempts(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [secondsLeft])

  const registerFailure = React.useCallback(() => {
    setAttempts((prev) => {
      const next = prev + 1
      if (next >= maxAttempts) setSecondsLeft(lockoutSeconds)
      return next
    })
  }, [maxAttempts, lockoutSeconds])

  const reset = React.useCallback(() => {
    setAttempts(0)
    setSecondsLeft(0)
  }, [])

  const remainingAttempts = Math.max(0, maxAttempts - attempts)

  return {
    isLocked,
    secondsLeft,
    remainingAttempts,
    showWarning: !isLocked && attempts > 0 && remainingAttempts <= 2,
    registerFailure,
    reset,
  }
}
