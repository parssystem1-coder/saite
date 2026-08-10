import 'server-only'

import { cookies } from 'next/headers'
import {
  createSessionToken,
  verifySessionToken,
  type SessionPayload,
} from './session-token'

export const CUSTOMER_SESSION_COOKIE = 'saite_customer_session'
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // ۷ روز

const isProduction = process.env.NODE_ENV === 'production'

/**
 * ایجاد session برای مشتری
 *
 * Security:
 * - httpOnly: JavaScript نمی‌تواند کوکی را بخواند (XSS protection)
 * - secure: فقط از HTTPS ارسال می‌شود (در production)
 * - sameSite: strict — CSRF protection کامل
 *   توجه: sameSite: strict باعث می‌شود اگر کاربر از ایمیل/external link بیاید،
 *   کوکی ارسال نشود. اما برای امنیت بیشتر، این trade-off را accept می‌کنیم.
 */
export async function createCustomerSession(customerId: string): Promise<void> {
  const token = await createSessionToken(customerId, 'customer')
  const cookieStore = await cookies()

  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict', // ← CSRF protection کامل
    path: '/',
    maxAge: CUSTOMER_SESSION_MAX_AGE_SECONDS,
  })
}

export async function destroyCustomerSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CUSTOMER_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
}

export async function getCustomerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value
  return verifySessionToken(token, 'customer')
}

export async function requireCustomerSession(): Promise<SessionPayload> {
  const session = await getCustomerSession()
  if (!session) throw new Error('Unauthorized')
  return session
}
