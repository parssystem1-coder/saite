import 'server-only'

const INJECTION_PATTERNS = [
  /ignore previous instructions/i,
  /forget your training/i,
  /system prompt/i,
  /you are now/i,
  /disregard all prior/i,
  /new instruction/i,
]

const PII_PATTERNS = [
  /\b\d{10,11}\b/g, // شماره موبایل ایران
  /\b\d{16}\b/g, // شماره کارت
  /\b\d{10}\b/g, // کد ملی
]

export function detectInjection(variables: Record<string, unknown>): boolean {
  const text = JSON.stringify(variables).toLowerCase()
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text))
}

export function redactPII(text: string): string {
  let result = text
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}
