import { describe, expect, it, beforeEach } from 'vitest'
import { createSessionToken, verifySessionToken } from '@/server/auth/session-token'

describe('Customer Session Token', () => {
  beforeEach(() => {
    process.env.CUSTOMER_SESSION_SECRET = 'test-customer-secret-12345'
    process.env.CUSTOMER_SESSION_VERSION = '1'
  })

  it('توکن معتبر تأیید می‌شود', async () => {
    const token = await createSessionToken('cust-123', 'customer')
    const payload = await verifySessionToken(token, 'customer')
    expect(payload).not.toBeNull()
    expect(payload?.sub).toBe('cust-123')
    expect(payload?.type).toBe('customer')
  })

  it('نوع اشتباه رد می‌شود', async () => {
    const token = await createSessionToken('cust-123', 'customer')
    const payload = await verifySessionToken(token, 'admin')
    expect(payload).toBeNull()
  })

  it('توکن دستکاری‌شده رد می‌شود', async () => {
    const token = await createSessionToken('cust-123', 'customer')
    const tampered = token.slice(0, -5) + 'XXXXX'
    const payload = await verifySessionToken(tampered, 'customer')
    expect(payload).toBeNull()
  })

  it('توکن منقضی رد می‌شود', async () => {
    const token = await createSessionToken('cust-123', 'customer', -10)
    const payload = await verifySessionToken(token, 'customer')
    expect(payload).toBeNull()
  })

  it('توکن بدون ver رد می‌شود (ابطال)', async () => {
    // توکن قدیمی بدون ver — باید رد شود
    const { encodePayload, signWithSecret } = await import('@/lib/auth/server/session-token-core')
    const payload = { sub: 'cust-123', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, type: 'customer' }
    const encoded = encodePayload(payload)
    const secret = process.env.CUSTOMER_SESSION_SECRET!
    const sig = await signWithSecret(encoded, secret)
    const token = `${encoded}.${sig}`
    const result = await verifySessionToken(token, 'customer')
    expect(result).toBeNull()
  })

  it('تغییر CUSTOMER_SESSION_VERSION توکن قبلی را باطل می‌کند', async () => {
    const token = await createSessionToken('cust-123', 'customer')
    process.env.CUSTOMER_SESSION_VERSION = '2'
    // کش را پاک کن تا نسخه جدید خوانده شود
    const { __resetCustomerSessionVersionCache } = await import('@/server/auth/session-token')
    __resetCustomerSessionVersionCache()
    const payload = await verifySessionToken(token, 'customer')
    expect(payload).toBeNull()
  })
})
