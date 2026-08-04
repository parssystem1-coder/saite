import { getDeviceId, getDeviceInfo } from '@/lib/auth/device-id'

/**
 * دستگاه‌های مورد اعتماد یک حساب.
 *
 * ── رفتار موردنظر ─────────────────────────────────────────────
 * «اگر کاربر روی لپ‌تاپ وارد شد و بعد روی موبایل آمد، دوباره رمز
 * بخواهد. اما همان دستگاه دفعهٔ بعد رمز نخواهد.»
 *
 * پیاده‌سازی: هنگام ورود موفق، شناسهٔ دستگاه ثبت می‌شود. دستگاه
 * ثبت‌نشده = ورود تازه لازم است.
 *
 * ── چرا «فقط یک دستگاه» پیاده نشد؟ ────────────────────────────
 * شما پرسیدید آیا می‌شود هر کاربر فقط روی یک دستگاه وارد باشد.
 * از نظر فنی ممکن است، اما توصیه نمی‌کنم و پیاده‌اش نکردم چون:
 *
 *   • کاربر عادی روزانه بین موبایل و لپ‌تاپ جابه‌جا می‌شود. اگر
 *     ورود روی موبایل، نشست لپ‌تاپ را ببندد، سبد خرید نیمه‌کاره
 *     از بین می‌رود و نرخ رها کردن خرید بالا می‌رود.
 *   • بانک‌ها و فروشگاه‌های بزرگ هم این کار را نمی‌کنند؛ به‌جایش
 *     دستگاه‌ها را **فهرست** می‌کنند و اجازهٔ خروج از راه دور
 *     می‌دهند. کنترل دست کاربر است، نه محدودیت اجباری.
 *   • محدودیت سخت روی مرورگر قابل دور زدن است (پاک‌کردن storage)،
 *     پس امنیت واقعی نمی‌آورد و فقط کاربر واقعی را آزار می‌دهد.
 *
 * راهی که پیاده شد: **چند دستگاه مجاز + شفافیت کامل**. کاربر در
 * پنل می‌بیند چه دستگاه‌هایی وارد شده‌اند و می‌تواند هرکدام را
 * حذف کند. سقف دستگاه‌ها هم محدود است.
 *
 * ── الزام فاز بک‌اند ──────────────────────────────────────────
 * این ماژول فقط پوسته است. سرور باید:
 *   • هر نشست را با refresh token جدا نگه دارد
 *   • حذف دستگاه = ابطال فوری توکن آن دستگاه
 *   • ورود از دستگاه ناشناس = ایمیل/پیامک اطلاع‌رسانی
 *   • ذخیرهٔ IP و زمان برای تشخیص ورود مشکوک
 *   • انقضای خودکار پس از N روز بی‌فعالیتی
 */

const STORAGE_KEY = 'saite:trusted-devices'

/** سقف دستگاه هم‌زمان — بیشتر از این نشانهٔ اشتراک‌گذاری حساب است */
export const MAX_TRUSTED_DEVICES = 5

export interface TrustedDevice {
  /** شناسهٔ مرورگر */
  deviceId: string
  /** حسابی که روی این دستگاه وارد شده */
  accountKey: string
  label: string
  kind: 'mobile' | 'desktop'
  /** ISO — آخرین ورود موفق */
  lastSeenAt: string
}

function readAll(): TrustedDevice[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTrustedDevice)
  } catch {
    return []
  }
}

function isTrustedDevice(value: unknown): value is TrustedDevice {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.deviceId === 'string' &&
    typeof v.accountKey === 'string' &&
    typeof v.label === 'string' &&
    typeof v.lastSeenAt === 'string'
  )
}

function writeAll(devices: TrustedDevice[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices))
  } catch {
    /* private mode */
  }
  // رویداد storage در همان تب fire نمی‌شود — ناظر داخلی لازم است
  notify()
}

/** کلید حساب — ایمیل یا موبایل، هرچه کاربر با آن وارد شده */
export function normalizeAccountKey(identifier: string): string {
  return identifier.trim().toLowerCase()
}

/**
 * آیا این مرورگر قبلاً برای این حساب تأیید شده؟
 * اگر نه، ورود با رمز لازم است.
 */
export function isDeviceTrusted(accountKey: string): boolean {
  const id = getDeviceId()
  if (!id) return false
  const key = normalizeAccountKey(accountKey)
  return readAll().some((d) => d.deviceId === id && d.accountKey === key)
}

/**
 * ثبت دستگاه فعلی پس از ورود موفق.
 * اگر از قبل بود، فقط زمان آخرین بازدید به‌روز می‌شود.
 */
export function trustCurrentDevice(accountKey: string): TrustedDevice | null {
  const id = getDeviceId()
  if (!id) return null

  const key = normalizeAccountKey(accountKey)
  const info = getDeviceInfo()
  const now = new Date().toISOString()

  const entry: TrustedDevice = {
    deviceId: id,
    accountKey: key,
    label: info.label,
    kind: info.kind,
    lastSeenAt: now,
  }

  const others = readAll().filter((d) => !(d.deviceId === id && d.accountKey === key))

  // جدیدترین اول؛ قدیمی‌ترها بیرون از سقف حذف می‌شوند
  const forThisAccount = [entry, ...others.filter((d) => d.accountKey === key)]
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
    .slice(0, MAX_TRUSTED_DEVICES)

  const forOtherAccounts = others.filter((d) => d.accountKey !== key)

  writeAll([...forThisAccount, ...forOtherAccounts])
  return entry
}

/** دستگاه‌های ثبت‌شدهٔ یک حساب — جدیدترین اول */
export function listTrustedDevices(accountKey: string): TrustedDevice[] {
  const key = normalizeAccountKey(accountKey)
  return readAll()
    .filter((d) => d.accountKey === key)
    .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt))
}

/** حذف یک دستگاه — دفعهٔ بعد از آن دستگاه رمز لازم می‌شود */
export function revokeDevice(accountKey: string, deviceId: string): void {
  const key = normalizeAccountKey(accountKey)
  writeAll(readAll().filter((d) => !(d.accountKey === key && d.deviceId === deviceId)))
}

/** حذف همهٔ دستگاه‌های یک حساب به‌جز دستگاه فعلی */
export function revokeOtherDevices(accountKey: string): void {
  const id = getDeviceId()
  const key = normalizeAccountKey(accountKey)
  writeAll(readAll().filter((d) => d.accountKey !== key || d.deviceId === id))
}

/** آیا دستگاه فعلی همین است؟ — برای نشان‌دادن برچسب «این دستگاه» */
export function isCurrentDevice(deviceId: string): boolean {
  return deviceId === getDeviceId()
}

/** فقط برای تست */
export function __clearTrustedDevices(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  cachedRaw = null
  cachedList = EMPTY_DEVICES
  notify()
}

// ── اشتراک برای useSyncExternalStore ─────────────────────────

const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

/** snapshot پایدار — بدون آن React حلقهٔ بی‌نهایت می‌زند */
let cachedRaw: string | null = null
let cachedList: readonly TrustedDevice[] = Object.freeze([])

export function getTrustedDevicesSnapshot(): readonly TrustedDevice[] {
  let raw: string | null = null
  try {
    raw = typeof window === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)
  } catch {
    raw = null
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw
    const parsed = readAll()
    cachedList = parsed.length > 0 ? Object.freeze(parsed) : Object.freeze([])
  }
  return cachedList
}

export function getTrustedDevicesServerSnapshot(): readonly TrustedDevice[] {
  return EMPTY_DEVICES
}

const EMPTY_DEVICES: readonly TrustedDevice[] = Object.freeze([])

export function subscribeTrustedDevices(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  listeners.add(callback)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(callback)
    window.removeEventListener('storage', onStorage)
  }
}
