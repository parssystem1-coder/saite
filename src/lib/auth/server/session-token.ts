import 'server-only'
import {
  encodePayload,
  decodePayload,
  signWithSecret,
  timingSafeEqual,
} from './session-token-core'

import { isAdminRole } from '@/lib/auth/rbac'
import type { AdminRole } from '@/types/user'

/**
 * توکن نشست مدیر — امضاشده با HMAC-SHA256 (هسته مشترک)
 *
 * این فایل حالا از `session-token-core` برای HMAC و base64url استفاده می‌کند
 * تا تکرار ۸۰٪ با نشست مشتری حذف شود. منطق ابطال `ver` و نقش اینجا می‌ماند.
 */

/** طول عمر نشست مدیر — کوتاه‌تر از نشست مشتری، عمداً */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8 // ۸ ساعت

/** نام کوکی — پیشوند `__Host-` در production امنیت بیشتری می‌دهد */
export const ADMIN_SESSION_COOKIE = 'saite_admin_session'

const DEV_FALLBACK_SECRET = 'saite-dev-only-session-secret-do-not-use-in-production'

function getSecret(): string {
  const fromEnv = process.env.ADMIN_SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 16) return fromEnv

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_SESSION_SECRET تعریف نشده یا کوتاه‌تر از ۱۶ کاراکتر است. ' +
        'بدون آن، توکن نشست مدیر قابل جعل است. یک مقدار تصادفی بسازید: ' +
        'openssl rand -base64 32'
    )
  }

  return DEV_FALLBACK_SECRET
}

export interface AdminSessionPayload {
  sub: string
  iat: number
  exp: number
  ver: string
  role: AdminRole
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(36)
}

let cachedVersion: string | null = null

export function getSessionVersion(): string {
  if (cachedVersion !== null) return cachedVersion

  const fingerprint = [
    process.env.ADMIN_SESSION_VERSION?.trim() ?? '1',
    process.env.ADMIN_USERNAME?.trim() ?? '',
    process.env.ADMIN_PASSWORD?.trim() ?? '',
    process.env.ADMIN_TOTP_SECRET?.trim() ?? '',
    process.env.ADMIN_SESSION_SECRET?.trim() ?? '',
    process.env.ADMIN_ROLE?.trim() ?? '',
  ].join('')

  cachedVersion = fnv1a(fingerprint)
  return cachedVersion
}

export function __resetSessionVersionCache(): void {
  cachedVersion = null
}

export async function createAdminSessionToken(
  adminId: string,
  role: AdminRole,
  maxAgeSeconds: number = ADMIN_SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: AdminSessionPayload = {
    sub: adminId,
    iat: now,
    exp: now + maxAgeSeconds,
    ver: getSessionVersion(),
    role,
  }

  const encoded = encodePayload(payload)
  const signature = await signWithSecret(encoded, getSecret())
  return `${encoded}.${signature}`
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [encoded, signature] = parts
  if (!encoded || !signature) return null

  let expected: string
  try {
    expected = await signWithSecret(encoded, getSecret())
  } catch {
    return null
  }

  if (!timingSafeEqual(signature, expected)) return null

  const payload = decodePayload<AdminSessionPayload>(encoded)
  if (!payload) return null

  if (typeof payload?.sub !== 'string' || typeof payload?.exp !== 'number') return null
  if (payload.exp * 1000 <= Date.now()) return null
  if (typeof payload.ver !== 'string') return null
  if (!timingSafeEqual(payload.ver, getSessionVersion())) return null
  if (!isAdminRole(payload.role)) return null

  return payload
}
