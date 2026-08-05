import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createFileStore,
  createMemoryStore,
} from '@/lib/auth/server/rate-limit-store'

/**
 * ذخیره‌سازی پایدار شمارندهٔ محدودیت نرخ.
 *
 * ══════════════════════════════════════════════════════════════
 *  مشکلی که این لایه حل می‌کند
 * ══════════════════════════════════════════════════════════════
 * نسخهٔ قبلی فقط `Map` در حافظه بود:
 *
 *   مهاجم ۱۰ بار تلاش می‌کند → قفل می‌شود
 *   سرور ری‌استارت می‌شود → شمارنده صفر، قفل از بین می‌رود
 *
 * روی سروری که خودکار ری‌استارت می‌شود، قفل عملاً هرگز پایدار
 * نبود.
 */

let dir: string
let filePath: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'saite-rl-'))
  filePath = join(dir, 'rate-limit.json')
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('نسخهٔ حافظه‌ای', () => {
  it('ذخیره و بازیابی می‌کند', () => {
    const store = createMemoryStore()
    store.set('ip-1', { count: 3, resetAt: Date.now() + 60_000 })
    expect(store.get('ip-1')?.count).toBe(3)
  })

  it('حذف کار می‌کند', () => {
    const store = createMemoryStore()
    store.set('ip-1', { count: 1, resetAt: Date.now() + 60_000 })
    store.delete('ip-1')
    expect(store.get('ip-1')).toBeUndefined()
  })

  it('sweep منقضی‌ها را پاک می‌کند', () => {
    const store = createMemoryStore()
    const now = Date.now()
    store.set('old', { count: 5, resetAt: now - 1000 })
    store.set('fresh', { count: 2, resetAt: now + 60_000 })

    store.sweep(now)

    expect(store.get('old')).toBeUndefined()
    expect(store.get('fresh')?.count).toBe(2)
  })
})

describe('🔑 نسخهٔ فایل‌محور — پایداری', () => {
  it('پس از ساخت دوباره، مقدار باقی می‌ماند', () => {
    /*
      این همان سناریوی ری‌استارت سرور است: نمونهٔ جدید باید
      شمارندهٔ قبلی را ببیند.
    */
    const first = createFileStore(filePath)
    first.set('attacker-ip', { count: 10, resetAt: Date.now() + 900_000 })

    const second = createFileStore(filePath)
    expect(second.get('attacker-ip')?.count).toBe(10)
  })

  it('🔑 قفل پس از ری‌استارت باقی می‌ماند', () => {
    const before = createFileStore(filePath)
    before.set('blocked', { count: 99, resetAt: Date.now() + 900_000 })

    // شبیه‌سازی ری‌استارت: نمونهٔ کاملاً تازه
    const after = createFileStore(filePath)
    expect(after.get('blocked')?.count).toBe(99)
  })

  it('رکورد منقضی پس از بارگذاری نادیده گرفته می‌شود', () => {
    const first = createFileStore(filePath)
    first.set('expired', { count: 10, resetAt: Date.now() - 1000 })

    const second = createFileStore(filePath)
    expect(second.get('expired')).toBeUndefined()
  })

  it('حذف روی دیسک هم اعمال می‌شود', () => {
    const first = createFileStore(filePath)
    first.set('key', { count: 5, resetAt: Date.now() + 60_000 })
    first.delete('key')

    expect(createFileStore(filePath).get('key')).toBeUndefined()
  })

  it('clear همه را پاک می‌کند', () => {
    const store = createFileStore(filePath)
    store.set('a', { count: 1, resetAt: Date.now() + 60_000 })
    store.set('b', { count: 2, resetAt: Date.now() + 60_000 })
    store.clear()

    expect(createFileStore(filePath).get('a')).toBeUndefined()
  })
})

describe('🔑 مقاومت در برابر خرابی', () => {
  it('فایل خراب باعث خطا نمی‌شود', () => {
    writeFileSync(filePath, 'this is not json at all', 'utf8')

    const store = createFileStore(filePath)
    expect(() => store.get('anything')).not.toThrow()
    expect(store.get('anything')).toBeUndefined()
  })

  it('رکورد بدشکل رد می‌شود', () => {
    writeFileSync(
      filePath,
      JSON.stringify({
        valid: { count: 3, resetAt: Date.now() + 60_000 },
        missingFields: { count: 1 },
        wrongTypes: { count: 'x', resetAt: 'y' },
      }),
      'utf8'
    )

    const store = createFileStore(filePath)
    expect(store.get('valid')?.count).toBe(3)
    expect(store.get('missingFields')).toBeUndefined()
    expect(store.get('wrongTypes')).toBeUndefined()
  })

  it('🔑 مسیر غیرقابل‌نوشتن ورود را نمی‌شکند', () => {
    /*
      روی بعضی محیط‌های serverless دیسک فقط-خواندنی است.
      محدودیت نرخ باید به حالت حافظه‌ای برگردد، نه اینکه
      کل ورود را از کار بیندازد.

      مسیر زیر عمداً نامعتبر است: `filePath` یک فایل موجود است،
      پس ساختن پوشه‌ای «داخل» آن ناممکن است (ENOTDIR).
    */
    writeFileSync(filePath, '{}', 'utf8')
    const store = createFileStore(join(filePath, 'nested', 'rate-limit.json'))
    expect(() => store.set('k', { count: 1, resetAt: Date.now() + 1000 })).not.toThrow()
    // همچنان در حافظه کار می‌کند
    expect(store.get('k')?.count).toBe(1)
  })

  it('فایل موقت پس از نوشتن باقی نمی‌ماند', () => {
    const store = createFileStore(filePath)
    store.set('key', { count: 1, resetAt: Date.now() + 60_000 })

    // نوشتن اتمیک است: temp → rename
    expect(() => readFileSync(filePath, 'utf8')).not.toThrow()
    expect(() => readFileSync(`${filePath}.${process.pid}.tmp`, 'utf8')).toThrow()
  })
})
