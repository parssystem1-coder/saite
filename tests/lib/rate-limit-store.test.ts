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
  it('ذخیره و بازیابی می‌کند', async () => {
    const store = createMemoryStore()
    await store.set('ip-1', { count: 3, resetAt: Date.now() + 60_000 })
    expect((await store.get('ip-1'))?.count).toBe(3)
  })

  it('حذف کار می‌کند', async () => {
    const store = createMemoryStore()
    await store.set('ip-1', { count: 1, resetAt: Date.now() + 60_000 })
    await store.delete('ip-1')
    expect(await store.get('ip-1')).toBeUndefined()
  })

  it('sweep منقضی‌ها را پاک می‌کند', async () => {
    const store = createMemoryStore()
    const now = Date.now()
    await store.set('old', { count: 5, resetAt: now - 1000 })
    await store.set('fresh', { count: 2, resetAt: now + 60_000 })

    await store.sweep(now)

    expect(await store.get('old')).toBeUndefined()
    expect((await store.get('fresh'))?.count).toBe(2)
  })
})

describe('🔑 نسخهٔ فایل‌محور — پایداری', () => {
  it('پس از ساخت دوباره، مقدار باقی می‌ماند', async () => {
    const first = createFileStore(filePath)
    await first.set('attacker-ip', { count: 10, resetAt: Date.now() + 900_000 })

    const second = createFileStore(filePath)
    expect((await second.get('attacker-ip'))?.count).toBe(10)
  })

  it('🔑 قفل پس از ری‌استارت باقی می‌ماند', async () => {
    const before = createFileStore(filePath)
    await before.set('blocked', { count: 99, resetAt: Date.now() + 900_000 })

    // شبیه‌سازی ری‌استارت: نمونهٔ کاملاً تازه
    const after = createFileStore(filePath)
    expect((await after.get('blocked'))?.count).toBe(99)
  })

  it('رکورد منقضی پس از بارگذاری نادیده گرفته می‌شود', async () => {
    const first = createFileStore(filePath)
    await first.set('expired', { count: 10, resetAt: Date.now() - 1000 })

    const second = createFileStore(filePath)
    expect(await second.get('expired')).toBeUndefined()
  })

  it('حذف روی دیسک هم اعمال می‌شود', async () => {
    const first = createFileStore(filePath)
    await first.set('key', { count: 5, resetAt: Date.now() + 60_000 })
    await first.delete('key')

    expect(await createFileStore(filePath).get('key')).toBeUndefined()
  })

  it('clear همه را پاک می‌کند', async () => {
    const store = createFileStore(filePath)
    await store.set('a', { count: 1, resetAt: Date.now() + 60_000 })
    await store.set('b', { count: 2, resetAt: Date.now() + 60_000 })
    await store.clear()

    expect(await createFileStore(filePath).get('a')).toBeUndefined()
  })
})

describe('🔑 مقاومت در برابر خرابی', () => {
  it('فایل خراب باعث خطا نمی‌شود', async () => {
    writeFileSync(filePath, 'this is not json at all', 'utf8')

    const store = createFileStore(filePath)
    await expect(store.get('anything')).resolves.toBeUndefined()
  })

  it('رکورد بدشکل رد می‌شود', async () => {
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
    expect((await store.get('valid'))?.count).toBe(3)
    expect(await store.get('missingFields')).toBeUndefined()
    expect(await store.get('wrongTypes')).toBeUndefined()
  })

  it('🔑 مسیر غیرقابل‌نوشتن ورود را نمی‌شکند', async () => {
    /*
      روی بعضی محیط‌های serverless دیسک فقط-خواندنی است.
      محدودیت نرخ باید به حالت حافظه‌ای برگردد، نه اینکه
      کل ورود را از کار بیندازد.

      مسیر زیر عمداً نامعتبر است: `filePath` یک فایل موجود است،
      پس ساختن پوشه‌ای «داخل» آن ناممکن است (ENOTDIR).
    */
    writeFileSync(filePath, '{}', 'utf8')
    const store = createFileStore(join(filePath, 'nested', 'rate-limit.json'))
    await expect(store.set('k', { count: 1, resetAt: Date.now() + 1000 })).resolves.toBeUndefined()
    // همچنان در حافظه کار می‌کند
    expect((await store.get('k'))?.count).toBe(1)
  })

  it('فایل موقت پس از نوشتن باقی نمی‌ماند', async () => {
    const store = createFileStore(filePath)
    await store.set('key', { count: 1, resetAt: Date.now() + 60_000 })

    // نوشتن اتمیک است: temp → rename
    expect(() => readFileSync(filePath, 'utf8')).not.toThrow()
    expect(() => readFileSync(`${filePath}.${process.pid}.tmp`, 'utf8')).toThrow()
  })
})
