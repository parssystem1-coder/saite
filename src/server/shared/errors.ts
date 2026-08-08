export class NotFoundError extends Error {
  readonly status = 404
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  readonly status = 400
  constructor(public readonly details: unknown) {
    super('اعتبارسنجی ناموفق')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends Error {
  readonly status = 401
  constructor(message = 'دسترسی غیرمجاز') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  readonly status = 403
  constructor(message = 'دسترسی ممنوع') {
    super(message)
    this.name = 'ForbiddenError'
  }
}
