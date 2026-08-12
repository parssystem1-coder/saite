import { describe, it, expect } from 'vitest'
import {
  isAllowedMime,
  extensionForMime,
  validateMagicBytes,
} from '@/server/upload/mime'

describe('upload/mime — منبع واحد MIME', () => {
  it('فرمت‌های مجاز را می‌پذیرد', () => {
    for (const mime of ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']) {
      expect(isAllowedMime(mime)).toBe(true)
      expect(extensionForMime(mime)).toBeTruthy()
    }
  })

  it('فرمت غیرمجاز را رد می‌کند', () => {
    expect(isAllowedMime('image/svg+xml')).toBe(false)
    expect(isAllowedMime('text/html')).toBe(false)
    expect(isAllowedMime('application/x-msdownload')).toBe(false)
    expect(extensionForMime('image/svg+xml')).toBeUndefined()
  })

  it('پسوند استاندارد را برمی‌گرداند', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg')
    expect(extensionForMime('image/png')).toBe('png')
    expect(extensionForMime('application/pdf')).toBe('pdf')
  })

  it('magic bytes — فایل معتبر پذیرفته می‌شود', () => {
    // PNG signature
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])
    expect(validateMagicBytes(png, 'image/png')).toBe(true)

    // JPEG signature
    const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    expect(validateMagicBytes(jpg, 'image/jpeg')).toBe(true)

    // PDF signature
    const pdf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d])
    expect(validateMagicBytes(pdf, 'application/pdf')).toBe(true)
  })

  it('magic bytes — فایل نامعتبر (MIME spoofing) رد می‌شود', () => {
    // اعلام PNG ولی محتوای HTML
    const html = Buffer.from('<html>nope</html>')
    expect(validateMagicBytes(html, 'image/png')).toBe(false)

    // اعلام PDF ولی محتوای متن
    expect(validateMagicBytes(Buffer.from('hello world'), 'application/pdf')).toBe(false)
  })

  it('magic bytes — MIME ناشناخته رد می‌شود', () => {
    expect(validateMagicBytes(Buffer.from('anything'), 'text/plain')).toBe(false)
  })
})
