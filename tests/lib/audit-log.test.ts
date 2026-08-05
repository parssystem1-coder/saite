import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  getUserAgent,
  readRecentAuditEntries,
  recordAuditEvent,
} from '@/lib/auth/server/audit-log'

/**
 * ثبت لاگ ورود مدیر.
 *
 * بدون لاگ، نفوذ هیچ ردی نمی‌گذارد. مهم‌تر از آن: تلاش‌های
 * ناموفق الگو نشان می‌دهند — ۵۰ شکست از یک IP یعنی حملهٔ فعال،
 * نه فراموشی رمز.
 */

let dir: string
let logPath: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'saite-audit-'))
  logPath = join(dir, 'audit.jsonl')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('نوشتن رکورد', () => {
  it('رکورد ورود موفق ثبت می‌شود', () => {
    recordAuditEvent({ event: 'login-success', ip: '203.0.113.5' }, logPath)

    const entries = readRecentAuditEntries(10, logPath)
    expect(entries).toHaveLength(1)
    expect(entries[0].event).toBe('login-success')
    expect(entries[0].ip).toBe('203.0.113.5')
  })

  it('زمان به فرمت ISO ثبت می‌شود', () => {
    recordAuditEvent({ event: 'login-failed', ip: '1.2.3.4' }, logPath)

    const [entry] = readRecentAuditEntries(1, logPath)
    expect(() => new Date(entry.at).toISOString()).not.toThrow()
    expect(entry.at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('چند رکورد پشت سر هم ثبت می‌شوند', () => {
    for (let i = 0; i < 5; i++) {
      recordAuditEvent({ event: 'login-failed', ip: `10.0.0.${i}` }, logPath)
    }
    expect(readRecentAuditEntries(10, logPath)).toHaveLength(5)
  })

  it('جدیدترین رکورد اول برمی‌گردد', () => {
    recordAuditEvent({ event: 'login-failed', ip: 'first' }, logPath)
    recordAuditEvent({ event: 'login-success', ip: 'second' }, logPath)

    const [newest] = readRecentAuditEntries(10, logPath)
    expect(newest.ip).toBe('second')
  })

  it('سقف تعداد رعایت می‌شود', () => {
    for (let i = 0; i < 20; i++) {
      recordAuditEvent({ event: 'login-failed', ip: `10.0.0.${i}` }, logPath)
    }
    expect(readRecentAuditEntries(5, logPath)).toHaveLength(5)
  })
})

describe('🔑 پاک‌سازی ورودی', () => {
  it('کاراکتر کنترلی حذف می‌شود — جلوگیری از تزریق خط جعلی', () => {
    /*
      اگر کاراکتر newline پاک نشود، مهاجم می‌تواند با یک
      نام کاربری ساختگی رکورد جعلی به لاگ اضافه کند و رد
      واقعی خود را پنهان کند.
    */
    recordAuditEvent(
      {
        event: 'login-failed',
        ip: '1.2.3.4',
        username: 'evil\n{"event":"login-success","ip":"fake"}',
      },
      logPath
    )

    const raw = readFileSync(logPath, 'utf8')
    expect(raw.trim().split('\n')).toHaveLength(1)

    const entries = readRecentAuditEntries(10, logPath)
    expect(entries).toHaveLength(1)
    expect(entries[0].event).toBe('login-failed')
  })

  it('🔑 user-agent بلند بریده می‌شود — جلوگیری از پر شدن دیسک', () => {
    recordAuditEvent(
      { event: 'login-failed', ip: '1.2.3.4', userAgent: 'x'.repeat(10_000) },
      logPath
    )

    const [entry] = readRecentAuditEntries(1, logPath)
    expect(entry.userAgent!.length).toBeLessThanOrEqual(200)
  })

  it('نام کاربری بلند بریده می‌شود', () => {
    recordAuditEvent(
      { event: 'login-failed', ip: '1.2.3.4', username: 'u'.repeat(500) },
      logPath
    )

    const [entry] = readRecentAuditEntries(1, logPath)
    expect(entry.username!.length).toBeLessThanOrEqual(64)
  })
})

describe('🔑 مقاومت در برابر خرابی', () => {
  it('فایل ناموجود آرایهٔ خالی می‌دهد — نه خطا', () => {
    expect(readRecentAuditEntries(10, join(dir, 'missing.jsonl'))).toEqual([])
  })

  it('خط خراب کل فایل را از کار نمی‌اندازد', () => {
    /*
      اگر برق وسط نوشتن برود، آخرین خط ناقص می‌ماند. آن یک خط
      نباید کل تاریخچه را غیرقابل خواندن کند.
    */
    recordAuditEvent({ event: 'login-success', ip: 'good-1' }, logPath)
    writeFileSync(logPath, `${readFileSync(logPath, 'utf8')}{"broken":\n`, 'utf8')
    recordAuditEvent({ event: 'login-success', ip: 'good-2' }, logPath)

    const entries = readRecentAuditEntries(10, logPath)
    expect(entries.map((e) => e.ip)).toContain('good-1')
    expect(entries.map((e) => e.ip)).toContain('good-2')
  })

  it('🔑 مسیر غیرقابل‌نوشتن باعث خطا نمی‌شود', () => {
    /*
      لاگ‌نویسی هرگز نباید ورود را بشکند. سیستم امنیتی که خودش
      سرویس را بخواباند، مشکل بزرگ‌تری از آن چیزی است که حل
      می‌کند.
    */
    // یک فایل موجود را به‌عنوان «پوشه» می‌دهیم → ENOTDIR
    writeFileSync(logPath, '', 'utf8')
    const impossible = join(logPath, 'nested', 'audit.jsonl')

    expect(() =>
      recordAuditEvent({ event: 'login-success', ip: '1.2.3.4' }, impossible)
    ).not.toThrow()
  })
})

describe('استخراج user-agent', () => {
  it('از هدر خوانده می‌شود', () => {
    const headers = new Headers({ 'user-agent': 'Mozilla/5.0 Test' })
    expect(getUserAgent(headers)).toBe('Mozilla/5.0 Test')
  })

  it('بدون هدر undefined می‌دهد', () => {
    expect(getUserAgent(new Headers())).toBeUndefined()
  })
})
