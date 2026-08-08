import 'server-only'

/**
 * توکن نشست مشتری — HMAC-SHA256، مشابه الگوی مدیر.
 *
 * فرمت: base64url(payload) + "." + base64url(hmac)
 */

const DEV_FALLBACK_SECRET = 'saite-dev-customer-secret-do-not-use-in-production'

function getSecret(): string {
  const fromEnv = process.env.CUSTOMER_SESSION_SECRET?.trim()
  if (fromEnv && fromEnv.length >= 16) return fromEnv

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CUSTOMER_SESSION_SECRET تعریف نشده یا کوتاه‌تر از ۱۶ کاراکتر است.'
    )
  }

  return DEV_FALLBACK_SECRET
}

export interface SessionPayload {
  sub: string
  iat: number
  exp: number
  type: 'customer' | 'admin'
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function sign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return toBase64Url(new Uint8Array(signature))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
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
  }

  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await sign(encoded)
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
    expected = await sign(encoded)
  } catch {
    return null
  }

  if (!timingSafeEqual(signature, expected)) return null

  let payload: SessionPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)))
  } catch {
    return null
  }

  if (typeof payload?.sub !== 'string' || typeof payload?.exp !== 'number') return null
  if (payload.exp * 1000 <= Date.now()) return null
  if (payload.type !== expectedType) return null

  return payload
}
