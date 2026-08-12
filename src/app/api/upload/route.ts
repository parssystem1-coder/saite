import { NextRequest, NextResponse } from 'next/server'
import { uploadService } from '@/server/upload/service'
import { requirePermission } from '@/lib/auth/server/require-role'
import { UPLOAD_MAX_SIZE_MB } from '@/server/shared/constants'
import { logger } from '@/server/shared/logger'
import { checkMutationRateLimit } from '@/server/shared/http-utils'
import {
  isAllowedMime,
  validateMagicBytes,
} from '@/server/upload/mime'

const FOLDER_RE = /^[a-z0-9-]{1,32}$/

export async function POST(req: NextRequest) {
  // Rate-limit برای upload (سخت‌گیرانه‌تر چون هزینه‌بر است)
  const rateLimitResponse = await checkMutationRateLimit(req, 'upload', 5, 60_000)
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

    // whitelist MIME — منبع واحد (src/server/upload/mime.ts)
    if (!isAllowedMime(file.type)) {
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
