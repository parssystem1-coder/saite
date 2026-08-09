import 'server-only'

/**
 * هسته مشترک HMAC-SHA256 برای توکن نشست — بدون وابستگی به نقش یا ابطال
 *
 * هر دو پیاده‌سازی (ادمین و مشتری) قبلاً این منطق را کپی کرده بودند (۸۰٪ هم‌پوشانی).
 * حالا یک منبع واحد است تا باگ timingSafeEqual یا base64url دو بار تعمیر نشود.
 */

export function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function signWithSecret(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return toBase64Url(new Uint8Array(signature))
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function encodePayload(payload: unknown): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
}

export function decodePayload<T>(encoded: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as T
  } catch {
    return null
  }
}
