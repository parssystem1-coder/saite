import { NextRequest, NextResponse } from 'next/server'
import { uploadService } from '@/server/upload/service'
import { requirePermission } from '@/lib/auth/server/require-role'

const MAX_SIZE_MB = 10
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
}

const FOLDER_RE = /^[a-z0-9-]{1,32}$/

export async function POST(req: NextRequest) {
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

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `حداکثر حجم ${MAX_SIZE_MB}MB` }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
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
    console.error('[Upload]', err)
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
  }
}
