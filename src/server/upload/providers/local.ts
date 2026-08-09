import 'server-only'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_LOCAL_DIR || 'public/uploads'
const PUBLIC_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const localDiskProvider = {
  name: 'local' as const,

  async upload(opts: {
    file: Buffer
    filename: string
    mimetype: string
    folder?: string
  }) {
    const folder = opts.folder || 'general'
    // دفاع عمقی: حتی اگر route اعتبارسنجی کرده، اینجا هم چک می‌کنیم
    if (!/^[a-z0-9-]{1,32}$/.test(folder)) {
      return { success: false, url: '', key: '', provider: 'local' as const, error: 'نام پوشه نامعتبر است' }
    }
    const dir = join(process.cwd(), UPLOAD_DIR, folder)
    if (!existsSync(dir)) await mkdir(dir, { recursive: true })

    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
    }
    const ext = mimeToExt[opts.mimetype] || opts.filename.split('.').pop()?.replace(/[^a-z0-9]/gi, '') || 'bin'
    const key = `${randomUUID()}.${ext}`
    const path = join(dir, key)

    await writeFile(path, opts.file)

    return {
      success: true,
      url: `${PUBLIC_URL}/uploads/${folder}/${key}`,
      key: `${folder}/${key}`,
      provider: 'local' as const,
      error: undefined,
    }
  },

  async delete(key: string) {
    const path = join(process.cwd(), UPLOAD_DIR, key)
    try {
      await unlink(path)
      return { success: true }
    } catch {
      return { success: false, error: 'File not found' }
    }
  },

  getUrl(key: string) {
    return `${PUBLIC_URL}/uploads/${key}`
  },
}
