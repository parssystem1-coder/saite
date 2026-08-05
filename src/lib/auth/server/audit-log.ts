import 'server-only'

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * ثبت لاگ ورود مدیر.
 *
 * ══════════════════════════════════════════════════════════════
 *  چرا لازم است
 * ══════════════════════════════════════════════════════════════
 * بدون لاگ، اگر کسی به پنل نفوذ کند هیچ ردی نمی‌ماند. مدیر
 * نمی‌فهمد چه زمانی، از کجا و چند بار تلاش شده.
 *
 * حتی مهم‌تر: **تلاش‌های ناموفق** الگو نشان می‌دهند. ۵۰ شکست از
 * یک IP ناشناس یعنی حملهٔ فعال، نه فراموشی رمز.
 *
 * ── چرا JSONL و نه JSON؟ ──────────────────────────────────────
 * هر خط یک رکورد مستقل است، پس نوشتن فقط `append` است — نه
 * خواندن کل فایل، تغییر، و نوشتن دوباره. یعنی:
 *   • سریع، حتی وقتی فایل بزرگ شد
 *   • اگر وسط نوشتن قطع شود، فقط آخرین خط ناقص می‌ماند
 *   • با `tail -f` قابل دنبال‌کردن است
 *
 * ── چرا IP کامل ذخیره می‌شود؟ ─────────────────────────────────
 * برای تشخیص حمله لازم است بدانید تلاش‌ها از یک منبع‌اند یا
 * پراکنده. این دادهٔ شخصی است، پس فایل زیر `.next/cache` است که
 * در `.gitignore` قرار دارد و هرگز کامیت نمی‌شود.
 */

export type AuditEvent =
  | 'login-success'
  | 'login-failed'
  | 'login-rate-limited'
  | 'totp-failed'
  | 'logout'

export interface AuditEntry {
  /** زمان به فرمت ISO — قابل مرتب‌سازی و بدون ابهام منطقهٔ زمانی */
  at: string
  event: AuditEvent
  /** نشانی IP یا `unknown-client` */
  ip: string
  /** نام کاربری واردشده — برای شکست‌ها مفید است */
  username?: string
  /** مرورگر/ابزار — تشخیص اسکریپت خودکار از کاربر واقعی */
  userAgent?: string
}

/** مسیر فایل لاگ — زیر `.next/cache` که در gitignore است */
export const DEFAULT_AUDIT_LOG_PATH = join(
  process.cwd(),
  '.next',
  'cache',
  'saite-admin-audit.jsonl'
)

/**
 * سقف طول `user-agent`.
 *
 * این رشته از کاربر می‌آید، پس بدون سقف می‌شود با یک هدر چندمگابایتی
 * دیسک را پر کرد.
 */
const MAX_UA_LENGTH = 200

/** حذف کاراکترهای کنترلی — جلوگیری از تزریق خط جعلی در لاگ */
function sanitize(value: string, maxLength: number): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, maxLength)
    .trim()
}

/**
 * نوشتن یک رکورد.
 *
 * هرگز throw نمی‌کند: اگر لاگ‌نویسی شکست بخورد، **ورود نباید
 * بشکند**. یک سیستم امنیتی که خودش سرویس را از کار بیندازد،
 * مشکل بزرگ‌تری از آن چیزی است که حل می‌کند.
 */
export function recordAuditEvent(
  entry: Omit<AuditEntry, 'at'>,
  filePath: string = DEFAULT_AUDIT_LOG_PATH
): void {
  // در تست فایل نمی‌نویسیم مگر مسیر صریح داده شود
  if (process.env.NODE_ENV === 'test' && filePath === DEFAULT_AUDIT_LOG_PATH) return

  const record: AuditEntry = {
    at: new Date().toISOString(),
    event: entry.event,
    ip: sanitize(entry.ip, 64),
    ...(entry.username ? { username: sanitize(entry.username, 64) } : {}),
    ...(entry.userAgent ? { userAgent: sanitize(entry.userAgent, MAX_UA_LENGTH) } : {}),
  }

  try {
    mkdirSync(dirname(filePath), { recursive: true })
    appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf8')
  } catch {
    /* لاگ‌نویسی هرگز نباید ورود را بشکند */
  }
}

/**
 * خواندن آخرین رکوردها — برای نمایش در پنل.
 *
 * خطوط خراب رد می‌شوند تا یک رکورد ناقص کل فهرست را از کار
 * نیندازد.
 */
export function readRecentAuditEntries(
  limit = 50,
  filePath: string = DEFAULT_AUDIT_LOG_PATH
): AuditEntry[] {
  let raw: string
  try {
    raw = readFileSync(filePath, 'utf8')
  } catch {
    return []
  }

  const lines = raw.split('\n').filter(Boolean)
  const entries: AuditEntry[] = []

  // از انتها می‌خوانیم — جدیدترین اول، و کل فایل parse نمی‌شود
  for (let i = lines.length - 1; i >= 0 && entries.length < limit; i--) {
    try {
      const parsed = JSON.parse(lines[i]) as AuditEntry
      if (typeof parsed?.at === 'string' && typeof parsed?.event === 'string') {
        entries.push(parsed)
      }
    } catch {
      /* خط خراب — رد شود */
    }
  }

  return entries
}

/** استخراج user-agent از هدرها */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent')?.trim() || undefined
}
