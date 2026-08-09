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

export function parsePagination(searchParams: URLSearchParams, defaultPerPage = 9): { page: number; perPage: number } {
  let page = Number(searchParams.get('page') || '1')
  let perPage = Number(searchParams.get('perPage') || String(defaultPerPage))

  if (!Number.isFinite(page) || page < 1) page = 1
  if (!Number.isFinite(perPage) || perPage < 1) perPage = defaultPerPage

  perPage = Math.min(100, Math.max(1, Math.floor(perPage)))
  page = Math.max(1, Math.floor(page))

  return { page, perPage }
}

export function parseNumberParam(value: string | null, fieldName: string): number | undefined {
  if (value === null || value === '' || value === undefined) return undefined
  const num = Number(value)
  if (!Number.isFinite(num)) {
    throw new ValidationError({ [fieldName]: `${fieldName} باید عدد معتبر باشد` })
  }
  return num
}
