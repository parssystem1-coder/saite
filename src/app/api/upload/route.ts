import { NextRequest, NextResponse } from 'next/server'
import { uploadService } from '@/server/upload/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { UPLOAD_MAX_SIZE_MB } from '@/server/shared/constants'
import { logger } from '@/server/shared/logger'
import { checkMutationRateLimit } from '@/server/shared/http-utils'
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
}

const FOLDER_RE = /^[a-z0-9-]{1,32}$/

/**
 * اعتبارسنجی magic bytes — دفاع عمقی در برابر MIME spoofing
 * هر MIME مجاز باید با امضای باینری متناظرش مطابقت داشته باشد
 */
function validateMagicBytes(buffer: Buffer, mime: string): boolean {
  // Check minimum length based on MIME type
  const minRequired = mime === 'application/pdf' ? 4 : 8
  if (buffer.length < minRequired) return false

  switch (mime) {
    case 'image/jpeg':
      // JPEG: FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff

    case 'image/png':
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      )

    case 'image/webp':
      // WebP: RIFF....WEBP (52 49 46 46 ?? ?? ?? ?? 57 45 42 50)
      if (buffer.length < 12) return false
      return (
        buffer[0] === 0x52 && // R
        buffer[1] === 0x49 && // I
        buffer[2] === 0x46 && // F
        buffer[3] === 0x46 && // F
        buffer[8] === 0x57 && // W
        buffer[9] === 0x45 && // E
        buffer[10] === 0x42 && // B
        buffer[11] === 0x50 // P
      )

    case 'image/gif':
      // GIF: 47 49 46 38 (GIF8)
      return (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38
      )

    case 'application/pdf':
      // PDF: 25 50 44 46 (%PDF)
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      )

    default:
      return false
  }
}

export async function POST(req: NextRequest) {
  // Rate-limit برای upload (سخت‌گیرانه‌تر چون هزینه‌بر است)
  const rateLimitResponse = checkMutationRateLimit(req, 'upload', 5, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  const guard = await requirePermission('content:write')
  if (!guard.ok) return guard.response

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folderRaw = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'فایل ارسال نشد' }, { status: 400 })
    }

    const extFromMime = ALLOWED_TYPES[file.type]
    if (!extFromMime) {
      return NextResponse.json({ error: 'فرمت فایل مجاز نیست' }, { status: 400 })
    }

    if (!FOLDER_RE.test(folderRaw)) {
      return NextResponse.json({ error: 'نام پوشه نامعتبر است' }, { status: 400 })
    }
    const folder = folderRaw

    if (file.size > UPLOAD_MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `حداکثر حجم ${UPLOAD_MAX_SIZE_MB}MB` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // ── اعتبارسنجی magic bytes — دفاع عمقی ──────────────────────
    if (!validateMagicBytes(buffer, file.type)) {
      logger.warn({ mime: file.type, filename: file.name }, '[Upload] magic bytes mismatch')
      return NextResponse.json({ error: 'محتوای فایل با فرمت اعلام‌شده مطابقت ندارد' }, { status: 400 })
    }

    const result = await uploadService.upload({
      file: buffer,
      filename: file.name,
      mimetype: file.type,
      folder,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 500 })
    }

    return NextResponse.json({
      url: result.url,
      key: result.key,
      provider: result.provider,
    })
  } catch (err) {
    logger.error({ err }, '[Upload] failed')
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
