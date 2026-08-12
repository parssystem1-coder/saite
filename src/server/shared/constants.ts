import 'server-only'

/**
 * ثابت‌های متمرکز — جایگزین magic numbers پراکنده
 *
 * هر عددی که در چند فایل تکرار شده یا تصمیم تجاری است، اینجا یک منبع دارد
 * تا با تغییر یک‌جا همه‌جا عوض شود و تست‌پذیر باشد.
 */

// ── پرداخت ────────────────────────────────────────────────
export const PAYMENT_INTENT_TTL_MS = 30 * 60 * 1000 // ۳۰ دقیقه
export const PAYMENT_MIN_AMOUNT = 1000 // ریال

// ── مالی ──────────────────────────────────────────────────
export const TAX_RATE = Number(process.env.TAX_RATE ?? '0.09') // ۹٪
export const INVOICE_DUE_DAYS = Number(process.env.INVOICE_DUE_DAYS ?? '7')

// ── صفحه‌بندی ─────────────────────────────────────────────
export const DEFAULT_PER_PAGE = 9
export const MAX_PER_PAGE = 100

// ── سفارش ─────────────────────────────────────────────────
export const MAX_QUANTITY_PER_LINE = 20
export const MAX_LINES = 50

// ── صف ────────────────────────────────────────────────────
export const OUTBOX_POLL_MS = Number(process.env.OUTBOX_POLL_MS ?? '5000')
export const OUTBOX_BATCH_SIZE = 100
export const OUTBOX_MAX_RETRY = 5

// ── موجودی ─────────────────────────────────────────────
// رزروهای پرداخت‌نشده هر یک دقیقه بررسی و در صورت انقضا آزاد می‌شوند.
export const INVENTORY_EXPIRY_POLL_MS = Number(process.env.INVENTORY_EXPIRY_POLL_MS ?? '60000')

// ── آپلود ─────────────────────────────────────────────────
export const UPLOAD_MAX_SIZE_MB = Number(process.env.UPLOAD_MAX_SIZE_MB ?? '10')

// ── AI ────────────────────────────────────────────────────
export const AI_TIMEOUT_MS = 10_000
/** سقف کلی یک پاسخ استریم (چت مشاور) — جلوگیری از اتصال بازمانده */
export const AI_STREAM_TIMEOUT_MS = 45_000
