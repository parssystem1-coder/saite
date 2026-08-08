import { NextRequest, NextResponse } from 'next/server'
import { createCustomerSession, destroyCustomerSession, getCustomerSession } from '@/server/auth/customer-session'
import { prisma } from '@/server/shared/db'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  // TODO: هش رمز + bcrypt/scrypt در فاز بعد
  const customer = await prisma.customer.findUnique({ where: { email } })
  if (!customer) {
    return NextResponse.json({ error: 'نام کاربری یا رمز نادرست' }, { status: 401 })
  }

  // فعلاً بدون هش — فقط برای dev
  if (password !== 'demo') {
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
