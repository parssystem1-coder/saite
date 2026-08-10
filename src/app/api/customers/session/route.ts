import { NextRequest, NextResponse } from 'next/server'
import { createCustomerSession, destroyCustomerSession, getCustomerSession } from '@/server/auth/customer-session'
import { prisma } from '@/server/shared/db'
import { verifyPassword, isPasswordHash } from '@/lib/auth/server/password-hash'
import { consumeRateLimit, getClientKey, getUsernameKey } from '@/lib/auth/server/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CUSTOMER_IP_LIMIT = { maxAttempts: 10, windowMs: 15 * 60_000 } as const
const CUSTOMER_EMAIL_LIMIT = { maxAttempts: 30, windowMs: 60 * 60_000 } as const
const FAILURE_DELAY_MS = process.env.NODE_ENV === 'test' ? 0 : 600

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  const clientKey = getClientKey(req.headers)
  const ipKey = `customer-login:${clientKey}`

  const ipLimit = consumeRateLimit(ipKey, CUSTOMER_IP_LIMIT.maxAttempts, CUSTOMER_IP_LIMIT.windowMs)
  if (!ipLimit.allowed) {
    const res = NextResponse.json({ error: 'درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.' }, { status: 429 })
    res.headers.set('Retry-After', String(ipLimit.retryAfterSeconds))
    return res
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    await delay(FAILURE_DELAY_MS)
    return NextResponse.json({ error: 'نام کاربری یا رمز نادرست' }, { status: 401 })
  }

  const { email, password } = body as { email?: unknown; password?: unknown }

  if (typeof email !== 'string' || typeof password !== 'string' || !email.includes('@')) {
    await delay(FAILURE_DELAY_MS)
    return NextResponse.json({ error: 'نام کاربری یا رمز نادرست' }, { status: 401 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const emailKey = getUsernameKey(normalizedEmail)

  const emailLimit = consumeRateLimit(emailKey, CUSTOMER_EMAIL_LIMIT.maxAttempts, CUSTOMER_EMAIL_LIMIT.windowMs)
  if (!emailLimit.allowed) {
    await delay(FAILURE_DELAY_MS)
    const res = NextResponse.json({ error: 'درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.' }, { status: 429 })
    res.headers.set('Retry-After', String(emailLimit.retryAfterSeconds))
    return res
  }

  const customer = await prisma.customer.findUnique({ where: { email: normalizedEmail } })

  // برای جلوگیری از user-enumeration، حتی وقتی کاربر وجود ندارد هم تأخیر و هش ساختگی
  if (!customer) {
    await delay(FAILURE_DELAY_MS)
    // هش ساختگی برای هم‌زمان‌سازی زمان
    await verifyPassword('dummy', 'scrypt.16384.8.1.dummy.dummy')
    return NextResponse.json({ error: 'نام کاربری یا رمز نادرست' }, { status: 401 })
  }

  let ok = false
  if (customer.passwordHash && isPasswordHash(customer.passwordHash)) {
    ok = await verifyPassword(password, customer.passwordHash)
  } else {
    // مشتری قدیمی بدون هش — فقط در dev با ALLOW_DEMO_LOGIN=true اجازه demo
    const isDemoAllowed = process.env.ALLOW_DEMO_LOGIN === 'true' && process.env.NODE_ENV !== 'production'
    if (isDemoAllowed) {
      ok = password === 'demo'
    } else {
      ok = false
    }
  }

  if (!ok) {
    await delay(FAILURE_DELAY_MS)
    return NextResponse.json({ error: 'نام کاربری یا رمز نادرست' }, { status: 401 })
  }

  await createCustomerSession(customer.id)
  return NextResponse.json({ success: true, customer: { id: customer.id, name: customer.name, email: customer.email } })
}

export async function GET() {
  const session = await getCustomerSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.sub } })
  if (!customer) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, customer: { id: customer.id, name: customer.name, email: customer.email } })
}

export async function DELETE() {
  await destroyCustomerSession()
  return NextResponse.json({ success: true })
}
