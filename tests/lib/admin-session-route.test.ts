import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Route Handler ورود مدیر.
 *
 * ── چرا `cookies()` mock می‌شود ───────────────────────────────
 * `next/headers` فقط داخل چرخهٔ درخواست Next کار می‌کند. در تست
 * یک جایگزین ساده می‌گذاریم تا بتوانیم بررسی کنیم کوکی با چه
 * گزینه‌هایی ست می‌شود — که دقیقاً نکتهٔ امنیتی این لایه است.
 */

interface RecordedCookie {
  name: string
  value: string
  options: Record<string, unknown>
}

const recorded: RecordedCookie[] = []

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: (name: string, value: string, options: Record<string, unknown>) => {
      recorded.push({ name, value, options })
    },
    get: (name: string) => {
      const last = [...recorded].reverse().find((c) => c.name === name)
      return last ? { name, value: last.value } : undefined
    },
  }),
}))

const { DELETE, POST } = await import('@/app/admin/api/session/route')
const { ADMIN_PASSWORD, ADMIN_USERNAME } = await import('@/lib/auth/server/admin-secret')
const { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } = await import(
  '@/lib/auth/server/session-token'
)
const { __resetAllRateLimits } = await import('@/lib/auth/server/rate-limit')
const { INVALID_CREDENTIALS_MESSAGE } = await import('@/lib/auth/admin-login-contract')

function loginRequest(body: unknown, ip = '203.0.113.1'): Request {
  return new Request('http://localhost:3000/admin/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function logoutRequest(): Request {
  return new Request('http://localhost:3000/admin/api/session', { method: 'DELETE' })
}

beforeEach(() => {
  recorded.length = 0
  __resetAllRateLimits()
})

describe('ورود موفق', () => {
  it('اعتبارنامهٔ درست پذیرفته می‌شود', async () => {
    const response = await POST(
      loginRequest({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })

  it('🔑 کوکی نشست با توکن معتبر ست می‌شود', async () => {
    await POST(loginRequest({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }))

    const cookie = recorded.find((c) => c.name === ADMIN_SESSION_COOKIE)
    expect(cookie).toBeDefined()

    const payload = await verifyAdminSessionToken(cookie?.value)
    expect(payload?.sub).toBe('admin-1')
  })

  it('🔑 کوکی httpOnly است — جاوااسکریپت نمی‌تواند بخواندش', async () => {
    await POST(loginRequest({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }))

    const cookie = recorded.find((c) => c.name === ADMIN_SESSION_COOKIE)
    expect(cookie?.options.httpOnly).toBe(true)
  })

  it('🔑 کوکی sameSite=strict است — جلوگیری از CSRF', async () => {
    await POST(loginRequest({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }))

    const cookie = recorded.find((c) => c.name === ADMIN_SESSION_COOKIE)
    expect(cookie?.options.sameSite).toBe('strict')
  })

  it('🔑 کوکی فقط برای مسیر /admin ارسال می‌شود', async () => {
    /*
      با Path=/admin مرورگر این کوکی را در درخواست‌های فروشگاه
      نمی‌فرستد. یعنی حتی اگر بخشی از فروشگاه آسیب‌پذیر باشد،
      نشست مدیر همراه آن درخواست نمی‌رود.
    */
    await POST(loginRequest({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }))

    const cookie = recorded.find((c) => c.name === ADMIN_SESSION_COOKIE)
    expect(cookie?.options.path).toBe('/admin')
  })

  it('کوکی عمر محدود دارد', async () => {
    await POST(loginRequest({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }))

    const cookie = recorded.find((c) => c.name === ADMIN_SESSION_COOKIE)
    expect(cookie?.options.maxAge).toBeGreaterThan(0)
    expect(cookie?.options.maxAge).toBeLessThanOrEqual(24 * 60 * 60)
  })
})

describe('🔑 ورود ناموفق', () => {
  it('رمز غلط با ۴۰۱ رد می‌شود', async () => {
    const response = await POST(
      loginRequest({ username: ADMIN_USERNAME, password: 'wrong' })
    )

    expect(response.status).toBe(401)
    expect(recorded.find((c) => c.name === ADMIN_SESSION_COOKIE)).toBeUndefined()
  })

  it('نام کاربری غلط با ۴۰۱ رد می‌شود', async () => {
    const response = await POST(
      loginRequest({ username: 'ghost', password: ADMIN_PASSWORD })
    )
    expect(response.status).toBe(401)
  })

  it('🔑 پیام خطا یکسان است — شمارش نام کاربری ممکن نیست', async () => {
    const wrongUser = await POST(
      loginRequest({ username: 'ghost', password: 'anything' }, '203.0.113.2')
    )
    const wrongPass = await POST(
      loginRequest({ username: ADMIN_USERNAME, password: 'anything' }, '203.0.113.3')
    )

    const a = (await wrongUser.json()) as { message: string }
    const b = (await wrongPass.json()) as { message: string }

    expect(a.message).toBe(b.message)
    expect(a.message).toBe(INVALID_CREDENTIALS_MESSAGE)
  })

  it('🔑 پاسخ خطا رمز یا نام کاربری را لو نمی‌دهد', async () => {
    const response = await POST(
      loginRequest({ username: ADMIN_USERNAME, password: 'x' })
    )
    const text = JSON.stringify(await response.json())

    expect(text).not.toContain(ADMIN_PASSWORD)
    expect(text).not.toContain('username')
  })

  it('بدنهٔ غیر-JSON رد می‌شود', async () => {
    const response = await POST(loginRequest('not json at all'))
    expect(response.status).toBe(400)
  })

  it('بدنهٔ ناقص رد می‌شود', async () => {
    const response = await POST(loginRequest({ username: ADMIN_USERNAME }))
    expect(response.status).toBe(400)
  })

  it('🔑 خطای اعتبارسنجی Zod به کلاینت درز نمی‌کند', async () => {
    /*
      اگر پیام Zod برمی‌گشت، مهاجم می‌فهمید کدام فیلد مشکل داشته
      و قوانین اعتبارسنجی چیست.
    */
    const response = await POST(loginRequest({ username: '', password: '' }))
    const body = (await response.json()) as { message: string }

    expect(body.message).toBe(INVALID_CREDENTIALS_MESSAGE)
    expect(body.message).not.toContain('وارد کنید')
  })
})

describe('🔑 محدودیت نرخ سمت سرور', () => {
  it('پس از تلاش‌های زیاد، ۴۲۹ برمی‌گرداند', async () => {
    const ip = '198.51.100.9'

    // سقف سرور ۱۰ تلاش است
    for (let i = 0; i < 10; i++) {
      await POST(loginRequest({ username: 'x', password: 'y' }, ip))
    }

    const blocked = await POST(loginRequest({ username: 'x', password: 'y' }, ip))
    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('Retry-After')).toBeTruthy()
  })

  it('محدودیت به IP بسته است، نه سراسری', async () => {
    for (let i = 0; i < 11; i++) {
      await POST(loginRequest({ username: 'x', password: 'y' }, '198.51.100.10'))
    }

    // کاربر دیگری از IP متفاوت نباید قفل باشد
    const other = await POST(
      loginRequest({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }, '198.51.100.11')
    )
    expect(other.status).toBe(200)
  })

  it('ورود موفق شمارنده را آزاد می‌کند', async () => {
    const ip = '198.51.100.12'

    for (let i = 0; i < 5; i++) {
      await POST(loginRequest({ username: 'x', password: 'y' }, ip))
    }

    const success = await POST(
      loginRequest({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD }, ip)
    )
    expect(success.status).toBe(200)

    // پس از موفقیت، پنجرهٔ تازه شروع می‌شود
    for (let i = 0; i < 9; i++) {
      const r = await POST(loginRequest({ username: 'x', password: 'y' }, ip))
      expect(r.status).not.toBe(429)
    }
  })
})

describe('خروج', () => {
  it('🔑 کوکی با maxAge=0 باطل می‌شود', async () => {
    await DELETE(logoutRequest())

    const cookie = recorded.find((c) => c.name === ADMIN_SESSION_COOKIE)
    expect(cookie?.options.maxAge).toBe(0)
    expect(cookie?.value).toBe('')
  })

  it('کوکی ابطال هم httpOnly می‌ماند', async () => {
    await DELETE(logoutRequest())

    const cookie = recorded.find((c) => c.name === ADMIN_SESSION_COOKIE)
    expect(cookie?.options.httpOnly).toBe(true)
    expect(cookie?.options.path).toBe('/admin')
  })
})
