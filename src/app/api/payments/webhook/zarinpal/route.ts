import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/shared/db'
import { zarinpalProvider } from '@/server/payments/providers/zarinpal'
import { ordersService } from '@/server/modules/orders/service'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const authority = searchParams.get('Authority') || searchParams.get('authority')
  const status = searchParams.get('Status')

  if (!authority) {
    return NextResponse.json({ error: 'Authority missing' }, { status: 400 })
  }

  // Idempotency: اگر قبلاً verified شده، همان نتیجه را برگردان
  const existing = await prisma.paymentIntent.findUnique({ where: { authority } })
  if (!existing) {
    return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 })
  }

  if (existing.verifiedAt) {
    return NextResponse.redirect(orderStatusUrl(existing.orderId))
  }

  if (status !== 'OK') {
    await prisma.paymentIntent.update({
      where: { authority },
      data: { status: 'failed', failureMessage: 'کاربر از پرداخت منصرف شد' },
    })
    return NextResponse.redirect(orderStatusUrl(existing.orderId, 'failed'))
  }

  try {
    const result = await zarinpalProvider.verifyPayment(
      {
        id: 'zarinpal',
        name: 'Zarinpal',
        code: 'zarinpal',
        environment: process.env.PAYMENT_SANDBOX === 'true' ? 'sandbox' : 'production',
        active: true,
        priority: 1,
        merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
        callbackUrl: '',
        supportsRefund: false,
        supportsPartialRefund: false,
        supportsVerify: true,
        currency: 'IRR',
        minAmount: 1000,
        timeoutSeconds: 30,
        healthStatus: 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      authority,
      existing.amount
    )

    await prisma.$transaction(async (tx) => {
      await tx.paymentIntent.update({
        where: { authority },
        data: {
          status: result.success ? 'succeeded' : 'failed',
          transactionId: result.transactionId,
          verifiedAt: new Date(),
          failureMessage: result.success ? null : result.message,
        },
      })

      if (result.success) {
        await tx.order.update({
          where: { id: existing.orderId },
          data: { status: 'paid' },
        })
      }
    })

    return NextResponse.redirect(orderStatusUrl(existing.orderId, result.success ? 'success' : 'failed'))
  } catch (err) {
    console.error('[Zarinpal Webhook]', err)
    return NextResponse.redirect(orderStatusUrl(existing.orderId, 'failed'))
  }
}

function orderStatusUrl(orderId: string, status?: string) {
  const base = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/orders/${orderId}`
  return status ? `${base}?status=${status}` : base
}
