'use client'

import {
  ADMIN_LOGIN_ENDPOINT,
  INVALID_CREDENTIALS_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  RATE_LIMITED_MESSAGE,
  type AdminLoginResponse,
} from '@/lib/auth/admin-login-contract'

/**
 * فراخوانی سرور برای ورود و خروج مدیر.
 *
 * ── چه چیزی عوض شد ────────────────────────────────────────────
 * قبلاً `verifyAdminCredentials` همین‌جا در مرورگر اجرا می‌شد و
 * رمز را با مقدار درون باندل مقایسه می‌کرد. حالا فقط یک درخواست
 * می‌فرستد و پاسخ سرور را برمی‌گرداند — هیچ دانشی از رمز ندارد.
 *
 * ── چرا `credentials: 'same-origin'`؟ ─────────────────────────
 * تا مرورگر کوکی نشست را در پاسخ ذخیره کند. بدون این، سرور کوکی
 * را می‌فرستد اما مرورگر نگهش نمی‌دارد.
 */

export type AdminLoginResult = { ok: true } | { ok: false; message: string }

/** ارسال اعتبارنامه به سرور */
export async function requestAdminLogin(
  username: string,
  password: string,
  signal?: AbortSignal
): Promise<AdminLoginResult> {
  let response: Response

  try {
    response = await fetch(ADMIN_LOGIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'same-origin',
      signal,
    })
  } catch {
    // خطای شبکه با «رمز غلط» فرق دارد و کاربر باید تفاوت را بفهمد
    return { ok: false, message: NETWORK_ERROR_MESSAGE }
  }

  if (response.status === 429) {
    return { ok: false, message: RATE_LIMITED_MESSAGE }
  }

  let body: AdminLoginResponse | null = null
  try {
    body = (await response.json()) as AdminLoginResponse
  } catch {
    body = null
  }

  if (!response.ok || !body?.ok) {
    return {
      ok: false,
      message: body && !body.ok ? body.message : INVALID_CREDENTIALS_MESSAGE,
    }
  }

  return { ok: true }
}

/**
 * ابطال نشست روی سرور.
 *
 * پاک‌کردن state کلاینت به‌تنهایی کافی نیست — کوکی سرور باید
 * واقعاً باطل شود، وگرنه کاربر «خارج شده» ولی نشستش معتبر است.
 */
export async function requestAdminLogout(): Promise<void> {
  try {
    await fetch(ADMIN_LOGIN_ENDPOINT, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
  } catch {
    // خروج نباید به خاطر خطای شبکه گیر کند؛ کوکی با انقضا هم می‌رود
  }
}
