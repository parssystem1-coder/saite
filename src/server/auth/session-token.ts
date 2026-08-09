import 'server-only'
import {
  encodePayload,
  decodePayload,
  signWithSecret,
  timingSafeEqual,
} from '@/lib/auth/server/session-token-core'

/**
 * توکن نشست مشتری — HMAC-SHA256 با هسته مشترک و ابطال نسخه‌ای
 *
 * فرمت: base64url(payload) + "." + base64url(hmac)
 * payload شامل ver برای ابطال گروهی است (مثل ادمین)
 */

const DEV_FALLBACK_SECRET = 'saite-dev-customer-secret-do-not-use-in-production'

function getSecret(): string {
  const fromEnv = process.env.CUSTOMER_SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 16) return fromEnv

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CUSTOMER_SESSION_SECRET تعریف نشده یا کوتاه‌تر از ۱۶ کاراکتر است.')
  }

  return DEV_FALLBACK_SECRET
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

export function getCustomerSessionVersion(): string {
  if (cachedVersion !== null) return cachedVersion
  const fingerprint = [
    process.env.CUSTOMER_SESSION_VERSION?.trim() ?? '1',
    process.env.CUSTOMER_SESSION_SECRET?.trim() ?? '',
  ].join('')
  cachedVersion = fnv1a(fingerprint)
  return cachedVersion
}

export function __resetCustomerSessionVersionCache(): void {
  cachedVersion = null
}

export interface SessionPayload {
  sub: string
  iat: number
  exp: number
  type: 'customer' | 'admin'
  ver: string
}

export async function createSessionToken(
  userId: string,
  type: 'customer' | 'admin',
  maxAgeSeconds: number = 60 * 60 * 24 * 7
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload: SessionPayload = {
    sub: userId,
    iat: now,
    exp: now + maxAgeSeconds,
    type,
    ver: getCustomerSessionVersion(),
  }

  const encoded = encodePayload(payload)
  const signature = await signWithSecret(encoded, getSecret())
  return `${encoded}.${signature}`
}

export async function verifySessionToken(
  token: string | undefined | null,
  expectedType: 'customer' | 'admin'
): Promise<SessionPayload | null> {
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

  const payload = decodePayload<SessionPayload>(encoded)
  if (!payload) return null

  if (typeof payload?.sub !== 'string' || typeof payload?.exp !== 'number') return null
  if (payload.exp * 1000 <= Date.now()) return null
  if (payload.type !== expectedType) return null
  if (typeof payload.ver !== 'string') return null
  if (!timingSafeEqual(payload.ver, getCustomerSessionVersion())) return null

  return payload
}
