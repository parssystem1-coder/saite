import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'
import { handleServiceError } from '@/server/shared/http-utils'

/**
 * فاز ۱ — نگاشت خطاهای Prisma به پاسخ HTTP معنادار.
 *
 * پیش‌تر هر خطای Prisma (مثل slug تکراری) به ۵۰۰ خام تبدیل می‌شد.
 * حالا P2002 (unique) → ۴۰۹ و P2025 (not found) → ۴۰۴.
 */
describe('handleServiceError — نگاشت خطاهای Prisma', () => {
  it('P2002 (unique constraint) → 409 CONFLICT', async () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`slug`)',
      { code: 'P2002', clientVersion: '6.19.3', meta: { target: ['slug'] } }
    )

    const res = handleServiceError(err)
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.code).toBe('CONFLICT')
    expect(body.error).toBeTruthy()
  })

  it('P2025 (record not found) → 404 NOT_FOUND', async () => {
    const err = new Prisma.PrismaClientKnownRequestError(
      'An operation failed because it depends on one or more records that were required but not found.',
      { code: 'P2025', clientVersion: '6.19.3', meta: {} }
    )

    const res = handleServiceError(err)
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.code).toBe('NOT_FOUND')
  })

  it('خطای ناشناخته → 500 INTERNAL_ERROR (رفتار قبلی حفظ می‌شود)', async () => {
    const res = handleServiceError(new Error('something unexpected'))
    expect(res.status).toBe(500)

    const body = await res.json()
    expect(body.code).toBe('INTERNAL_ERROR')
  })
})
