import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/shared/db'
import { resolvePaymentProviderByCode } from '@/server/payments/gateway'
import { ordersService } from '@/server/modules/orders/service'
import { InvalidStateTransitionError } from '@/server/modules/orders/state-machine'
import { OrderEvents } from '@/server/shared/event-types'
import { logger } from '@/server/shared/logger'
import { getSiteUrl } from '@/server/shared/site-url'

/**
 * Webhook زرین‌پال — Security Model:
 *
 * زرین‌پال API v4 از webhook signature استفاده نمی‌کند. در عوض:
 * 1. Authority یک random string است که فقط زرین‌پال و ما می‌دانیم
 * 2. ما merchant_id + amount + authority را به verify API می‌فرستیم
 * 3. زرین‌پال چک می‌کند که این authority با این amount مطابقت دارد
 * 4. اگر مطابقت نداشت، reject می‌کند
 *
 * Security layers:
 * - Amount verification: مبلغ از DB خوانده می‌شود (نه از callback)
 * - Zarinpal API verify: با API زرین‌پال verify می‌کنیم
 * - Idempotency: verifiedAt check قبل از verify
 * - Atomic update: $transaction برای جلوگیری از race condition
 * - State machine: فقط transition مجاز از state machine
 */

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const authority = searchParams.get('Authority') || searchParams.get('authority')
  const status = searchParams.get('Status')

  if (!authority) {
    return NextResponse.json({ error: 'Authority missing' }, { status: 400 })
  }

  // ── Layer 1: Idempotency — اگر قبلاً verified شده، redirect بدون re-verify ──
  const existing = await prisma.paymentIntent.findUnique({ where: { authority } })
  if (!existing) {
    return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 })
  }

  if (existing.verifiedAt) {
    logger.debug({ authority, orderId: existing.orderId }, '[Webhook] Already verified, redirecting')
    return NextResponse.redirect(orderStatusUrl(existing.orderId))
  }

  // ── Layer 2: User cancelled ──
  if (status !== 'OK') {
    await prisma.paymentIntent.update({
      where: { authority },
      data: { status: 'failed', failureMessage: 'کاربر از پرداخت منصرف شد' },
    })
    return NextResponse.redirect(orderStatusUrl(existing.orderId, 'failed'))
  }

  try {
    // ── Layer 3: Verify with Zarinpal API ──
    // resolve از گیتوی → fail-closed: بدون credential زارین‌پال، verify انجام نمی‌شود
    const { adapter: verifyAdapter, provider: verifyProvider } = resolvePaymentProviderByCode('zarinpal')
    const verifyResult = await verifyAdapter.verifyPayment(
      verifyProvider,
      authority,
      existing.amount // ← Amount از DB، نه از callback
    )

    // ── Layer 4: Atomic state update — جلوگیری از race condition ──
    // استفاده از $transaction + updateMany با where condition
    // اگر دو request هم‌زمان بیایند، فقط یکی موفق می‌شود
    //
    // ⚠️ حیاتی: در همان تراکنش، OutboxEvent «order.paid» هم ثبت می‌شود.
    // اگر transitionState پایین‌تر (پس از commit) شکست بخورد یا process بمیرد،
    // درخواست بعدی به شاخهٔ «Already verified» می‌رود و بدون این رویداد جبرانی،
    // پولِ گرفته‌شده هرگز به سفارش paid تبدیل نمی‌شد. worker outbox این رویداد
    // را با retry پردازش می‌کند و handlePaidOrder کاملاً idempotent است.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const updateResult = await prisma.$transaction(async (tx: any) => {
      const txResult = await tx.paymentIntent.updateMany({
        where: {
          authority,
          verifiedAt: null, // ← فقط اگر هنوز verify نشده
        },
        data: {
          status: verifyResult.success ? 'succeeded' : 'failed',
          transactionId: verifyResult.transactionId,
          verifiedAt: new Date(),
          failureMessage: verifyResult.success ? null : verifyResult.message,
        },
      })
      if (txResult.count > 0 && verifyResult.success) {
        await tx.outboxEvent.create({
          data: {
            type: OrderEvents.paid,
            payload: { orderId: existing.orderId, authority } as any,
            aggregateId: existing.orderId,
          },
        })
      }
      return txResult
    })

    // اگر count=0، یعنی قبلاً verify شده (race condition)
    if (updateResult.count === 0) {
      logger.warn({ authority }, '[Webhook] Already verified (race condition prevented)')
      const verified = await prisma.paymentIntent.findUnique({ where: { authority } })
      return NextResponse.redirect(orderStatusUrl(verified?.orderId || existing.orderId))
    }

    // ── Layer 5: State machine transition ──
    if (verifyResult.success) {
      try {
        await ordersService.transitionState(existing.orderId, 'paid', 'zarinpal-webhook')
        logger.info({ orderId: existing.orderId, authority }, '[Webhook] Payment verified successfully')
      } catch (e) {
        if (e instanceof InvalidStateTransitionError) {
          // سفارش قبلاً paid شده — idempotent، نادیده بگیر
          logger.info({ orderId: existing.orderId }, '[Webhook] Order already paid, ignoring transition')
        } else {
          throw e
        }
      }
    }

    return NextResponse.redirect(orderStatusUrl(existing.orderId, verifyResult.success ? 'success' : 'failed'))
  } catch (err) {
    logger.error({ err, authority }, '[Webhook] Error processing payment')
    return NextResponse.redirect(orderStatusUrl(existing.orderId, 'failed'))
  }
}

/**
 * مقصد بازگشت کاربر پس از پرداخت.
 *
 * صفحهٔ عمومی `/orders/[id]` هنوز وجود ندارد؛ هدایت به آن یعنی ۴۰۴ درست
 * بعد از پرداخت موفق. تا زمان ساخت آن صفحه، به داشبورد مشتری (سفارش‌های من)
 * هدایت می‌کنیم و وضعیت پرداخت را در query می‌گذاریم تا UI پیام مناسب نشان دهد.
 */
function orderStatusUrl(orderId: string, status?: string) {
  const base = `${getSiteUrl()}/dashboard`
  const params = new URLSearchParams({ orderId })
  if (status) params.set('payment', status)
  return `${base}?${params.toString()}`
}
