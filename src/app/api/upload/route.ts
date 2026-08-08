import { NextRequest, NextResponse } from 'next/server'
import { uploadService } from '@/server/upload/service'

const MAX_SIZE_MB = 10
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'general'

    if (!file) {
      return NextResponse.json({ error: 'فایل ارسال نشد' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'فرمت فایل مجاز نیست' }, { status: 400 })
    }

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
