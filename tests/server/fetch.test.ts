import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchJson, HttpError } from '@/server/shared/fetch'

describe('fetchJson — timeout/retry/HttpError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('پاسخ موفق JSON را parse می‌کند', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, data: [1, 2, 3] }),
    }))

    const out = await fetchJson<{ ok: boolean; data: number[] }>('https://example.com/x')
    expect(out.ok).toBe(true)
    expect(out.data).toEqual([1, 2, 3])
  })

  it('پاسخ غیر-OK به HttpError با status تبدیل می‌شود', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    }))

    await expect(fetchJson('https://example.com/x')).rejects.toBeInstanceOf(HttpError)
    await expect(fetchJson('https://example.com/x')).rejects.toMatchObject({
      status: 503,
    } as never)
  })

  it('timeout باعث reject با پیام timeout می‌شود', async () => {
    // fetch ای که هرگز resolve نمی‌شود اما به AbortSignal گوش می‌دهد
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'))
          })
        })
      })
    )

    await expect(
      fetchJson('https://example.com/x', { timeoutMs: 50 })
    ).rejects.toThrow(/timeout/i)
  })

  it('خطای موقت با retry دوباره تلاش می‌شود و موفق می‌شود', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 502, text: async () => 'bad gateway' })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => '{"n":1}' })
    vi.stubGlobal('fetch', fetchMock)

    const out = await fetchJson<{ n: number }>('https://example.com/x', {
      retries: 2,
      initialDelayMs: 1,
      maxDelayMs: 2,
    })
    expect(out).toEqual({ n: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('خطای موقت پس از اتمام retry ها reject می‌شود', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'err' })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchJson('https://example.com/x', { retries: 1, initialDelayMs: 1 })
    ).rejects.toBeInstanceOf(HttpError)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
