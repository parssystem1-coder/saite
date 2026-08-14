import 'server-only'
import pino from 'pino'

/**
 * فیلدهای PII که باید در لاگ redact شوند — export شده تا هم در
 * ساختِ logger استفاده شود و هم در تست مستقیماً قابل بررسی باشد.
 */
export const REDACT_PATHS = [
  'to',
  '*.to',
  'email',
  '*.email',
  'phone',
  '*.phone',
  'password',
  '*.password',
  'authorization',
  'headers.authorization',
  '*.headers.authorization',
  'headers.cookie',
  '*.headers.cookie',
]

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  base: { pid: process.pid },
  // Redaction فیلدهای PII — قبل از نوشتن لاگ، این مسیرها با [REDACTED]
  // جایگزین می‌شوند تا ایمیل/تلفن/رمز/توکن در لاگ نشت نکند.
  redact: {
    paths: REDACT_PATHS,
    censor: '[REDACTED]',
  },
})

export function childLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings)
}

