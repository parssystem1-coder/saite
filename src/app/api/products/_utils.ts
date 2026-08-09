import { NextResponse } from 'next/server'
import { NotFoundError, ValidationError } from '@/server/shared/errors'

export function handleServiceError(err: unknown): NextResponse {
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 })
  }
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message, details: err.details }, { status: 400 })
  }
  // خطاهای اعتبارسنجی دامنه‌ای که ValidationError را extend نمی‌کنند (Coupon, StateMachine)
  if (err instanceof Error && (err.name === 'CouponValidationError' || err.name === 'InvalidStateTransitionError')) {
    const status = err.name === 'InvalidStateTransitionError' ? 409 : 400
    return NextResponse.json({ error: err.message }, { status })
  }
  console.error('[API Error]', err)
  return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
}
