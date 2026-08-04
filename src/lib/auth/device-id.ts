/**
 * شناسهٔ پایدار دستگاه/مرورگر.
 *
 * ── چرا اثرانگشت‌گیری (fingerprinting) نمی‌کنیم؟ ───────────────
 * روش‌های رایج مثل canvas fingerprinting یا جمع‌آوری فونت‌ها و
 * افزونه‌ها سه ایراد دارند:
 *   ۱. نقض حریم خصوصی — کاربر را بین سایت‌ها قابل ردیابی می‌کنند
 *   ۲. غیرقابل اتکا — با به‌روزرسانی مرورگر عوض می‌شوند
 *   ۳. مرورگرهای مدرن فعالانه مسدودشان می‌کنند
 *
 * به‌جای آن یک شناسهٔ تصادفی می‌سازیم و در همان مرورگر ذخیره
 * می‌کنیم. این شناسه هیچ اطلاعاتی دربارهٔ کاربر ندارد و فقط
 * می‌گوید «این همان مرورگری است که قبلاً دیده بودیم».
 *
 * ── محدودیت صادقانه ───────────────────────────────────────────
 * این شناسه در localStorage است، پس:
 *   • پاک‌کردن داده‌های مرورگر → شناسهٔ جدید → ورود دوباره لازم
 *   • حالت ناشناس (incognito) → همیشه شناسهٔ جدید
 *   • کاربر می‌تواند آن را دستکاری کند
 *
 * بنابراین این «امنیت» نیست، «تشخیص دستگاه» است. امنیت واقعی از
 * سمت سرور می‌آید (بخش پایین).
 */

const DEVICE_ID_KEY = 'saite:device-id'

/** تولید شناسهٔ تصادفی با پشتیبانی از مرورگرهای قدیمی‌تر */
function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // جایگزین: ۱۶ بایت تصادفی رمزنگاری‌شده
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }

  // آخرین راه — فقط برای محیط‌های بسیار قدیمی
  return `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * شناسهٔ این مرورگر را برمی‌گرداند؛ اگر نبود می‌سازد.
 * روی سرور همیشه رشتهٔ خالی (نباید در SSR استفاده شود).
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''

  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing && existing.length >= 8) return existing

    const fresh = generateDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, fresh)
    return fresh
  } catch {
    // حالت private یا storage غیرفعال — شناسهٔ موقت
    return generateDeviceId()
  }
}

// ── توصیف خوانا برای نمایش در فهرست دستگاه‌ها ─────────────────

export interface DeviceInfo {
  /** مثلاً «کروم روی ویندوز» */
  label: string
  /** موبایل یا رومیزی — برای انتخاب آیکون */
  kind: 'mobile' | 'desktop'
}

function detectBrowser(ua: string): string {
  // ترتیب مهم است: Edge و Opera رشتهٔ Chrome را هم دارند
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/OPR\/|Opera/i.test(ua)) return 'Opera'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Chrome\//i.test(ua)) return 'Chrome'
  if (/Safari\//i.test(ua)) return 'Safari'
  return 'مرورگر ناشناس'
}

function detectOs(ua: string): string {
  if (/Android/i.test(ua)) return 'اندروید'
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
  if (/Windows/i.test(ua)) return 'ویندوز'
  if (/Mac OS X|Macintosh/i.test(ua)) return 'مک'
  if (/Linux/i.test(ua)) return 'لینوکس'
  return 'سیستم ناشناس'
}

/**
 * توصیف دستگاه فعلی برای نمایش به کاربر.
 *
 * فقط از user-agent استفاده می‌کند — نه اثرانگشت. هدف این است که
 * کاربر در فهرست دستگاه‌ها بفهمد کدام ردیف مال کدام دستگاه است.
 */
export function getDeviceInfo(userAgent?: string): DeviceInfo {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  if (!ua) return { label: 'دستگاه ناشناس', kind: 'desktop' }

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua)
  return {
    label: `${detectBrowser(ua)} روی ${detectOs(ua)}`,
    kind: isMobile ? 'mobile' : 'desktop',
  }
}
