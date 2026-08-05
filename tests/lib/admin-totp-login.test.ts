import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * جریان ورود دومرحله‌ای — از دید Route Handler.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا این تست‌ها جدا از `admin-session-route.test.ts` هستند
 * ══════════════════════════════════════════════════════════════
 * فعال بودن TOTP از متغیر محیطی خوانده می‌شود و آن مقدار در
 * لحظهٔ **بارگذاری ماژول** ثابت می‌شود. پس برای آزمودن حالت
 * «TOTP روشن»، باید ماژول با env متفاوت از نو بارگذاری شود.
 *
 * `vi.resetModules()` + `await import()` داخل هر تست همین کار را
 * می‌کند. مخلوط کردنش با تست‌های حالت عادی، ترتیب اجرا را شکننده
 * می‌کرد.
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
    get: () => undefined,
  }),
}))

/** کلید ثابت — تا کد قابل پیش‌بینی باشد */
const TEST_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'
const TEST_PASSWORD = 'totp-test-password'
const TEST_USERNAME = 'totpadmin'

const originalEnv = { ...process.env }

beforeEach(() => {
  recorded.length = 0
  vi.resetModules()
  process.env.ADMIN_USERNAME = TEST_USERNAME
  process.env.ADMIN_PASSWORD = TEST_PASSWORD
  process.env.ADMIN_TOTP_SECRET = TEST_SECRET
})

afterEach(() => {
  process.env = { ...originalEnv }
})

/** بارگذاری تازهٔ ماژول‌ها با env فعلی */
async function loadModules() {
  const route = await import('@/app/admin/api/session/route')
  const totp = await import('@/lib/auth/server/totp')
  const rateLimit = await import('@/lib/auth/server/rate-limit')
  const secret = await import('@/lib/auth/server/admin-secret')
  rateLimit.__resetAllRateLimits()
  return { route, totp, secret }
}

function loginRequest(body: unknown, ip: string): Request {
  return new Request('http://localhost:3000/admin/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

describe('🔑 وقتی TOTP فعال است', () => {
  it('پرچم فعال بودن درست خوانده می‌شود', async () => {
    const { secret } = await loadModules()
    expect(secret.IS_TOTP_ENABLED).toBe(true)
  })

  it('🔑 رمز درست بدون کد کافی نیست', async () => {
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest({ username: TEST_USERNAME, password: TEST_PASSWORD }, '10.1.0.1')
    )

    expect(response.status).toBe(401)
    // نشستی ساخته نشده
    expect(recorded).toHaveLength(0)
  })

  it('پاسخ به فرم می‌گوید فیلد کد را نشان دهد', async () => {
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest({ username: TEST_USERNAME, password: TEST_PASSWORD }, '10.1.0.2')
    )
    const body = (await response.json()) as { totpRequired?: boolean }

    expect(body.totpRequired).toBe(true)
  })

  it('🔑 رمز غلط، وجود TOTP را لو نمی‌دهد', async () => {
    /*
      اگر با رمز غلط هم `totpRequired` برمی‌گشت، مهاجم بدون
      دانستن رمز می‌فهمید این حساب دومرحله‌ای دارد.
    */
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest({ username: TEST_USERNAME, password: 'wrong-password' }, '10.1.0.3')
    )
    const body = (await response.json()) as { totpRequired?: boolean }

    expect(body.totpRequired).toBeUndefined()
  })

  it('🔑 کد درست ورود را کامل می‌کند', async () => {
    const { route, totp } = await loadModules()

    const code = totp.generateTotpCode(TEST_SECRET, Math.floor(Date.now() / 1000))
    const response = await route.POST(
      loginRequest(
        { username: TEST_USERNAME, password: TEST_PASSWORD, totpCode: code },
        '10.1.0.4'
      )
    )

    expect(response.status).toBe(200)
    expect(recorded.some((c) => c.name === 'saite_admin_session')).toBe(true)
  })

  it('🔑 کد غلط رد می‌شود حتی با رمز درست', async () => {
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest(
        { username: TEST_USERNAME, password: TEST_PASSWORD, totpCode: '000000' },
        '10.1.0.5'
      )
    )

    expect(response.status).toBe(401)
    expect(recorded).toHaveLength(0)
  })

  it('🔑 کد معتبرِ کلید دیگر پذیرفته نمی‌شود', async () => {
    const { route, totp } = await loadModules()

    const otherSecret = totp.generateTotpSecret()
    const code = totp.generateTotpCode(otherSecret, Math.floor(Date.now() / 1000))

    const response = await route.POST(
      loginRequest(
        { username: TEST_USERNAME, password: TEST_PASSWORD, totpCode: code },
        '10.1.0.6'
      )
    )

    expect(response.status).toBe(401)
  })

  it('کد بدشکل رد می‌شود', async () => {
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest(
        { username: TEST_USERNAME, password: TEST_PASSWORD, totpCode: 'abcdef' },
        '10.1.0.7'
      )
    )

    expect(response.status).toBe(400)
  })
})

describe('وقتی TOTP غیرفعال است', () => {
  beforeEach(() => {
    delete process.env.ADMIN_TOTP_SECRET
    vi.resetModules()
  })

  it('پرچم خاموش است', async () => {
    const { secret } = await loadModules()
    expect(secret.IS_TOTP_ENABLED).toBe(false)
  })

  it('🔑 ورود با نام کاربری و رمز کافی است', async () => {
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest({ username: TEST_USERNAME, password: TEST_PASSWORD }, '10.2.0.1')
    )

    expect(response.status).toBe(200)
  })

  it('کد اضافی مانع ورود نمی‌شود', async () => {
    // اگر کاربر از نصب قبلی کدی وارد کند، نباید ورود بشکند
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest(
        { username: TEST_USERNAME, password: TEST_PASSWORD, totpCode: '123456' },
        '10.2.0.2'
      )
    )

    expect(response.status).toBe(200)
  })
})

describe('🔑 رمز هش‌شده', () => {
  beforeEach(() => {
    delete process.env.ADMIN_TOTP_SECRET
    vi.resetModules()
  })

  it('ورود با رمز هش‌شده کار می‌کند', async () => {
    /*
      این مسیر کامل را می‌سنجد: هش ساخته می‌شود، در env
      می‌نشیند، و ورود با رمز اصلی باید موفق باشد.
    */
    const { hashPassword } = await import('@/lib/auth/server/password-hash')
    process.env.ADMIN_PASSWORD = await hashPassword(TEST_PASSWORD)

    vi.resetModules()
    const { route, secret } = await loadModules()

    expect(secret.IS_PASSWORD_HASHED).toBe(true)

    const response = await route.POST(
      loginRequest({ username: TEST_USERNAME, password: TEST_PASSWORD }, '10.3.0.1')
    )
    expect(response.status).toBe(200)
  })

  it('🔑 رمز غلط در برابر هش رد می‌شود', async () => {
    const { hashPassword } = await import('@/lib/auth/server/password-hash')
    process.env.ADMIN_PASSWORD = await hashPassword(TEST_PASSWORD)

    vi.resetModules()
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest({ username: TEST_USERNAME, password: 'not-the-password' }, '10.3.0.2')
    )
    expect(response.status).toBe(401)
  })

  it('🔑 خودِ رشتهٔ هش به‌عنوان رمز کار نمی‌کند', async () => {
    /*
      تلهٔ کلاسیک: اگر کسی هش را از .env.local بردارد و
      به‌عنوان رمز وارد کند، نباید بپذیرد.

      نکته: پاسخ اینجا ۴۰۰ است نه ۴۰۱ — چون رشتهٔ هش بلندتر از
      سقف ۱۲۸ کاراکتری schema است و پیش از رسیدن به تأیید رمز
      رد می‌شود. هر دو کد یعنی «ورود نکردی» و پیام یکسان است،
      پس نشت اطلاعاتی ندارد.
    */
    const { hashPassword } = await import('@/lib/auth/server/password-hash')
    const hash = await hashPassword(TEST_PASSWORD)
    process.env.ADMIN_PASSWORD = hash

    vi.resetModules()
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest({ username: TEST_USERNAME, password: hash }, '10.3.0.3')
    )

    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(response.status).toBeLessThan(500)
    expect(recorded).toHaveLength(0)
  })

  it('🔑 هش کوتاه‌شده هم رد می‌شود', async () => {
    // نسخه‌ای که از سقف طول رد نمی‌شود، تا واقعاً به تأیید برسد
    const { hashPassword } = await import('@/lib/auth/server/password-hash')
    process.env.ADMIN_PASSWORD = await hashPassword(TEST_PASSWORD)

    vi.resetModules()
    const { route } = await loadModules()

    const response = await route.POST(
      loginRequest({ username: TEST_USERNAME, password: 'scrypt.16384.8.1.a.b' }, '10.3.0.4')
    )
    expect(response.status).toBe(401)
  })
})
