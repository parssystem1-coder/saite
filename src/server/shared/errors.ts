/**
 * خطاهای دامنه‌ای — Base class برای تمام خطاهای قابل پیش‌بینی
 *
 * تمام خطاهایی که در service layer رخ می‌دهند و باید به client برگردند
 * از این کلاس extend می‌کنند. این باعث می‌شود:
 * 1. handleServiceError فقط با instanceof chain کار کند
 * 2. هر خطا status و code خود را داشته باشد
 * 3. تست‌پذیری بالاتر
 */
export class DomainError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'DomainError'
    this.status = status
    this.code = code
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends DomainError {
  constructor(public readonly details: unknown, message = 'اعتبارسنجی ناموفق') {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'دسترسی غیرمجاز') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'دسترسی ممنوع') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class CouponValidationError extends ValidationError {
  constructor(message: string) {
    super({ message }, message)
    this.name = 'CouponValidationError'
    // Override code
    ;(this as { code: string }).code = 'COUPON_VALIDATION_ERROR'
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`گذار ${from} → ${to} مجاز نیست`, 409, 'INVALID_STATE_TRANSITION')
    this.name = 'InvalidStateTransitionError'
  }
}
