import { describe, it, expect } from 'vitest'
import pino from 'pino'
import { Writable } from 'node:stream'
import { REDACT_PATHS } from '@/server/shared/logger'

/**
 * فاز ۳ — Redaction فیلدهای PII در pino.
 *
 * نمی‌توانیم به راحتی خروجی `logger` سراسری را در تست capture کنیم
 * (transport پیکربندی دارد)، پس همان مجموعهٔ `REDACT_PATHS` را با یک
 * logger تستی که به stream مینویسد می‌سازیم و verify می‌کنیم که
 * ایمیل/تلفن/رمز/توکن واقعاً [REDACTED] می‌شوند.
 */
function makeTestLogger() {
  const lines: unknown[] = []
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(JSON.parse(chunk.toString()))
      cb()
    },
  })
  const log = pino({ redact: { paths: REDACT_PATHS, censor: '[REDACTED]' } }, stream)
  return { lines, log }
}

describe('pino redact — فیلدهای PII', () => {
  it('مسیرهای redact شامل فیلدهای حساس است', () => {
    for (const path of ['to', 'email', 'phone', 'password', 'authorization', '*.email']) {
      expect(REDACT_PATHS).toContain(path)
    }
  })

  it('ایمیل گیرنده در `to` → [REDACTED]', () => {
    const { lines, log } = makeTestLogger()
    log.info({ to: 'customer@example.com', template: 'welcome' }, 'send email')
    const line = lines[0] as Record<string, unknown>
    expect(line.to).toBe('[REDACTED]')
    expect(line.template).toBe('welcome') // غیر-PII دست نمی‌خورد
  })

  it('email/phone/password → [REDACTED]', () => {
    const { lines, log } = makeTestLogger()
    log.info(
      { email: 'admin@saite.local', phone: '+98...', password: 'secret' },
      'auth'
    )
    const line = lines[0] as Record<string, unknown>
    expect(line.email).toBe('[REDACTED]')
    expect(line.phone).toBe('[REDACTED]')
    expect(line.password).toBe('[REDACTED]')
  })

  it('هدر authorization → [REDACTED]', () => {
    const { lines, log } = makeTestLogger()
    log.info({ headers: { authorization: 'Bearer abc.def', 'content-type': 'json' } }, 'req')
    const line = lines[0] as { headers: Record<string, unknown> }
    expect(line.headers.authorization).toBe('[REDACTED]')
    expect(line.headers['content-type']).toBe('json')
  })
})
