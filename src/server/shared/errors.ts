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
  constructor(
    public readonly details: unknown,
    message = 'اعتبارسنجی ناموفق',
    code = 'VALIDATION_ERROR'
  ) {
    super(message, 400, code)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'دسترسی غیرمجاز') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

/**
 * پیکربندی ضروری سرویس در محیط اجرا وجود ندارد.
 *
 * عمداً 503 است، نه 500: خطا از درخواست کاربر نیست و retry پس از
 * اصلاح تنظیمات ممکن است موفق شود. این خطا برای جلوگیری از fallback
 * خطرناک به providerهای mock در production استفاده می‌شود.
 */
export class ServiceUnavailableError extends DomainError {
  constructor(message = 'سرویس موقتاً در دسترس نیست', code = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code)
    this.name = 'ServiceUnavailableError'
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
    // code از طریق constructor پاس می‌شود — بدون دور زدن readonly با cast
    super({ message }, message, 'COUPON_VALIDATION_ERROR')
    this.name = 'CouponValidationError'
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(`گذار ${from} → ${to} مجاز نیست`, 409, 'INVALID_STATE_TRANSITION')
    this.name = 'InvalidStateTransitionError'
  }
}
