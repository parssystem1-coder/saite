import { describe, it, expect, vi } from 'vitest'
import { createRedisStore, createResilientRedisStore } from '@/lib/auth/server/rate-limit-store'

/** mock سبک ioredis — set امضای tuple-ish و value را در Map نگه می‌دارد */
function makeRedisMock() {
  const values = new Map<string, string>()
  return {
    get: vi.fn(async (key: string) => values.get(key)),
    set: vi.fn(async (key: string, value: string, _mode?: string, _ttl?: number) => {
      values.set(key, value)
      return 'OK'
    }),
    del: vi.fn(async (...keys: string[]) => {
      for (const k of keys) values.delete(k)
      return keys.length
    }),
    scan: vi.fn(async () => ['0', [] as string[]] as [string, string[]]),
    __values: values,
  }
}

describe('createRedisStore', () => {
  it('set سپس get همان bucket را برمی‌گرداند', async () => {
    const redis = makeRedisMock()
    const store = createRedisStore(redis as never)

    await store.set('ip-1', { count: 3, resetAt: Date.now() + 60_000 })
    const got = await store.get('ip-1')
    expect(got?.count).toBe(3)
  })

  it('set از کلید rl: و TTL استفاده می‌کند', async () => {
    const redis = makeRedisMock()
    const store = createRedisStore(redis as never)

    await store.set('ip-1', { count: 1, resetAt: Date.now() + 60_000 })
    const call = vi.mocked(redis.set).mock.calls[0]!
    expect(call[0]).toBe('rl:ip-1')
    // ioredis: set(key, value, 'EX', ttl)
    expect(call[2]).toBe('EX')
    expect((call[3] as number) ?? 0).toBeGreaterThanOrEqual(59)
  })

  it('delete سطل را حذف می‌کند', async () => {
    const redis = makeRedisMock()
    const store = createRedisStore(redis as never)

    await store.set('ip-1', { count: 1, resetAt: Date.now() + 60_000 })
    await store.delete('ip-1')
    expect(await store.get('ip-1')).toBeUndefined()
  })

  it('get روی کلیدِ نبوده undefined می‌دهد', async () => {
    const store = createRedisStore(makeRedisMock() as never)
    expect(await store.get('nope')).toBeUndefined()
  })
})

describe('createResilientRedisStore — fail-open', () => {
  it('وقتی Redis خطا می‌دهد، به حافظه fallback می‌کند', async () => {
    const redis = {
      get: vi.fn(async () => {
        throw new Error('Redis down')
      }),
      set: vi.fn(async () => {
        throw new Error('Redis down')
      }),
      del: vi.fn(async () => {
        throw new Error('Redis down')
      }),
      scan: vi.fn(async () => {
        throw new Error('Redis down')
      }),
    }
    const store = createResilientRedisStore(redis as never)

    await store.set('ip-1', { count: 1, resetAt: Date.now() + 60_000 })
    const got = await store.get('ip-1')
    expect(got?.count).toBe(1)
  })

  it('وقتی Redis سالم است، مقدار در Redis ذخیره می‌شود', async () => {
    const redis = makeRedisMock()
    const store = createResilientRedisStore(redis as never)

    await store.set('ip-1', { count: 2, resetAt: Date.now() + 60_000 })
    const got = await store.get('ip-1')
    expect(got?.count).toBe(2)
    expect(redis.__values.has('rl:ip-1')).toBe(true)
  })
})
