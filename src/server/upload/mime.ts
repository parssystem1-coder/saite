import 'server-only'

/**
 * اعتبارسنجی و نگاشت MIME — تنها منبع حقیقت برای آپلود.
 *
 * هر دو سمت (Route اعتبارسنجی و provider ذخیره‌سازی) از همین map و
 * magic-bytes استفاده می‌کنند تا mapping فرمت دوبار نگهداری نشود.
 */

/** MIME های مجاز → پسوند استاندارد */
export const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
}

/** فرمت‌هایی که magic-byte دارند و حداقل بایت لازم برای بررسی */
const MAGIC_BYTES: Record<string, { min: number; matches: (b: Buffer) => boolean }> = {
  'image/jpeg': {
    min: 3,
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    min: 8,
    matches: (b) =>
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  'image/webp': {
    min: 12,
    matches: (b) =>
      b[0] === 0x52 && // R
      b[1] === 0x49 && // I
      b[2] === 0x46 && // F
      b[3] === 0x46 && // F
      b[8] === 0x57 && // W
      b[9] === 0x45 && // E
      b[10] === 0x42 && // B
      b[11] === 0x50, // P
  },
  'image/gif': {
    min: 4,
    matches: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  },
  'application/pdf': {
    min: 4,
    matches: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
  },
}

/** فرمت مجاز است؟ */
export function isAllowedMime(mime: string): boolean {
  return mime in ALLOWED_MIME
}

/** پسوند استاندارد برای MIME مجاز — undefined اگر مجاز نباشد */
export function extensionForMime(mime: string): string | undefined {
  return ALLOWED_MIME[mime]
}

/**
 * اعتبارسنجی magic bytes — دفاع عمیق در برابر MIME spoofing.
 * هر MIME مجاز باید با امضای باینری متناظرش مطابقت داشته باشد.
 */
export function validateMagicBytes(buffer: Buffer, mime: string): boolean {
  const def = MAGIC_BYTES[mime]
  if (!def) return false
  if (buffer.length < def.min) return false
  return def.matches(buffer)
}
